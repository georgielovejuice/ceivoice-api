import { Ollama } from "ollama";
import { PrismaClient } from "@prisma/client";
import config from "../config/environment";

const prisma = new PrismaClient();
const ollama = new Ollama({ host: config.ai.ollamaHost });

// ─── Skill keyword hints for llama3b (small models need explicit guidance) ──────
const SKILL_HINTS: Record<string, string[]> = {
  storage:        ["storage", "disk", "drive", "hdd", "ssd", "nas", "space", "file", "quota", "capacity"],
  network:        ["wifi", "wi-fi", "ethernet", "internet", "vpn", "connectivity", "network", "lan", "wan", "bandwidth", "ping"],
  hr:             ["payroll", "leave", "salary", "onboard", "employee", "hr", "holiday", "benefit", "contract", "resign"],
  authentication: ["login", "password", "mfa", "2fa", "sso", "account", "access", "locked", "credential", "sign in", "sign-in"],
  software:       ["software", "app", "application", "install", "license", "update", "crash", "error", "program"],
  hardware:       ["hardware", "laptop", "computer", "pc", "monitor", "keyboard", "mouse", "printer", "device", "screen"],
  facilities:     ["room", "desk", "office", "ac", "air", "facilities", "chair", "building", "floor"],
};

// ─── Deterministic fallback: score each agent by skill-keyword overlap ────────
function deterministicAgentMatch(
  userMessage: string,
  topicKeywords: string,
  agentList: { id: number; name: string; skills: string }[],
): { id: number; score: number } | null {
  const haystack = `${userMessage} ${topicKeywords}`.toLowerCase();

  let bestId = -1;
  let bestScore = 0;

  for (const agent of agentList) {
    const agentSkills = agent.skills.toLowerCase().split(/,\s*/);
    let score = 0;

    for (const skill of agentSkills) {
      // Direct skill name match in message
      if (haystack.includes(skill)) {
        score += 10;
      }

      // Keyword hint match
      const hints = SKILL_HINTS[skill] ?? [];
      for (const hint of hints) {
        if (haystack.includes(hint)) {
          score += 3;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = agent.id;
    }
  }

  return bestScore > 0 ? { id: bestId, score: bestScore } : null;
}

// ─── Build a compact skill-hint block for the prompt ─────────────────────────
function buildSkillHintBlock(agentList: { skills: string }[]): string {
  const allSkills = [
    ...new Set(
      agentList.flatMap((a) => a.skills.toLowerCase().split(/,\s*/)),
    ),
  ];

  return allSkills
    .map((skill) => {
      const hints = SKILL_HINTS[skill];
      return hints
        ? `- "${skill}" covers: ${hints.join(", ")}`
        : `- "${skill}"`;
    })
    .join("\n");
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class AiService {
  private readonly modelName = config.ai.modelName;

  async processTicketFull(
    ticketId: number,
    userMessage: string,
    availableCategoryNames: string[],
    availableAgents: any[],
  ) {
    try {
      // ── Build agent list ────────────────────────────────────────────────────
      const agentMap: Record<number, string> = {};

      const agentList = availableAgents
        .filter((a) => a.scopes && a.scopes.length > 0)
        .map((a, index) => {
          agentMap[index] = a.user_id;
          return {
            id:     index,
            name:   a.full_name ?? "Agent",
            skills: a.scopes.map((s: any) => s.scope_name).join(", "),
          };
        });

      console.log("[AI] Agent list:", agentList);

      const UNASSIGNED_ID       = -1;
      const CONFIDENCE_THRESHOLD = agentList.length <= 3 ? 50 : 65; // more lenient for small pools

      const agentListWithUnassigned = [
        ...agentList,
        {
          id:     UNASSIGNED_ID,
          name:   "Unassigned Queue",
          skills: "Use ONLY if the issue is completely out of scope or no agent has any related skill.",
        },
      ];

      const skillHintBlock = buildSkillHintBlock(agentList);

      // ── CALL 1 — Classify ticket ────────────────────────────────────────────
      const call1Prompt = `
You are a helpdesk ticket classifier. Analyze the support request below and return ONLY a JSON object.

Support request: "${userMessage}"
Valid categories: ${JSON.stringify(availableCategoryNames)}

Return ONLY this JSON (no explanation, no markdown):
{
  "title": "Short concise title under 100 characters",
  "category": "Exact match from the valid categories list",
  "priority": "Low" or "Medium" or "High" or "Critical",
  "summary": "2 sentences. First: core problem. Second: business impact. No first-person.",
  "suggested_solution": "1. Step one. 2. Step two.",
  "topic_keywords": "2-3 words describing the technical domain e.g. network connectivity, payroll salary, software access, disk storage",
  "category_confidence": <integer 0-100>,
  "category_reason": "one sentence why this category fits"
}
`.trim();

      const t0 = Date.now();

      const response1 = await ollama.chat({
        model:    this.modelName,
        format:   "json",
        messages: [{ role: "user", content: call1Prompt }],
        options:  { temperature: 0.2 },
      });

      const data1 = JSON.parse(response1.message.content);
      console.log("[AI] Call 1 result:", data1);

      // ── CALL 2 — Assign agent ────────────────────────────────────────────────
      const call2Prompt = `
You are a helpdesk dispatcher. Pick the best agent from the list below.

User message: "${userMessage}"
Topic keywords: "${data1.topic_keywords}"

Skill reference (use this to match):
${skillHintBlock}

Agents:
${JSON.stringify(agentListWithUnassigned, null, 2)}

Rules:
1. Read the user message and topic keywords carefully.
2. Use the skill reference above to find which agent's skill matches the topic.
3. Even a loose keyword match is enough — pick the closest agent.
4. Only pick Unassigned Queue (id: ${UNASSIGNED_ID}) if truly NO agent has any related skill.
5. confidence: how sure you are (0–100). Any reasonable match should be >= 70.

Return ONLY this JSON (no explanation, no markdown):
{
  "assignee_id": <id number from the agents list>,
  "confidence": <integer 0-100>,
  "reason": "one sentence explaining the skill match"
}
`.trim();

      const response2 = await ollama.chat({
        model:    this.modelName,
        format:   "json",
        messages: [{ role: "user", content: call2Prompt }],
        options:  { temperature: 0.1 },
      });

      const processingMs = Date.now() - t0;
      const data2 = JSON.parse(response2.message.content);
      console.log("[AI] Call 2 result:", data2);

      // ── Resolve final assignee (AI → deterministic fallback) ────────────────
      let assigneeId: number;

      if (
        data2.assignee_id !== UNASSIGNED_ID &&
        data2.confidence >= CONFIDENCE_THRESHOLD
      ) {
        // AI was confident enough
        assigneeId = data2.assignee_id;
      } else {
        // AI was not confident — try deterministic fallback
        const fallback = deterministicAgentMatch(
          userMessage,
          data1.topic_keywords,
          agentList,
        );

        if (fallback) {
          console.log(
            `[AI] Using deterministic fallback → agent id=${fallback.id} score=${fallback.score}`,
          );
          assigneeId = fallback.id;
        } else {
          assigneeId = UNASSIGNED_ID;
        }
      }

      // ── Map internal index back to user_id ─────────────────────────────────
      const finalAssigneeId =
        assigneeId !== UNASSIGNED_ID && agentMap[assigneeId]
          ? agentMap[assigneeId]
          : null;

      const finalCategoryName = availableCategoryNames.includes(data1.category)
        ? data1.category
        : availableCategoryNames[0] ?? "General";

      const solutionText = Array.isArray(data1.suggested_solution)
        ? "- " + data1.suggested_solution.join("\n- ")
        : data1.suggested_solution;

      // ── Persist results ─────────────────────────────────────────────────────
      const categoryRecord = await prisma.category.findUnique({
        where: { name: finalCategoryName },
      });

      await prisma.ticket.update({
        where: { ticket_id: ticketId },
        data: {
          title:              data1.title            ?? "New Support Request",
          summary:            data1.summary          ?? "Summary generation failed.",
          suggested_solution: solutionText,
          priority:           data1.priority         ?? "Medium",
          assignee_user_id:   finalAssigneeId,
          category_id:        categoryRecord?.category_id,
        },
      });

      await prisma.aiTicketMetric.upsert({
        where:  { ticket_id: ticketId },
        update: {
          processing_ms:         processingMs,
          suggested_category_id: categoryRecord?.category_id ?? null,
          suggested_assignee_id: finalAssigneeId,
        },
        create: {
          ticket_id:             ticketId,
          processing_ms:         processingMs,
          suggested_category_id: categoryRecord?.category_id ?? null,
          suggested_assignee_id: finalAssigneeId,
        },
      });

      await prisma.aiTicketConfidence.upsert({
        where:  { ticket_id: ticketId },
        update: {
          assignment_confidence: data2.confidence         ?? null,
          assignment_reason:     data2.reason             ?? null,
          category_confidence:   data1.category_confidence ?? null,
          category_reason:       data1.category_reason    ?? null,
        },
        create: {
          ticket_id:             ticketId,
          assignment_confidence: data2.confidence         ?? null,
          assignment_reason:     data2.reason             ?? null,
          category_confidence:   data1.category_confidence ?? null,
          category_reason:       data1.category_reason    ?? null,
        },
      });

      // ── CALL 3 — Suggest merge with existing drafts ─────────────────────────
      const recentDrafts = await prisma.ticket.findMany({
        where: {
          status:           { name: "Draft" },
          ticket_id:        { not: ticketId },
          parent_ticket_id: null,
        },
        orderBy: { created_at: "desc" },
        take:    20,
        select:  { ticket_id: true, title: true, summary: true },
      });

      if (recentDrafts.length > 0) {
        const call3Prompt = `
You are a helpdesk deduplication assistant.

New ticket topic: "${data1.topic_keywords}"
New ticket summary: "${data1.summary}"

Existing draft tickets:
${JSON.stringify(recentDrafts)}

Task: Find any existing draft that describes the IDENTICAL issue as the new ticket.
To be considered identical, ALL of the following must be true:
- Same affected system or tool (e.g. both about WiFi, both about login, both about payroll)
- Same type of problem (e.g. both are connectivity failures, both are authentication errors)
- Same symptoms described by the user

Do NOT suggest a merge if:
- They are only in the same general category (e.g. both are "hardware" but different devices)
- One is a test ticket and the other is a real issue
- The summaries are vague or generic with no specific matching symptoms

Return ONLY this JSON (no explanation, no markdown):
{
  "should_merge": true or false,
  "parent_ticket_id": <ticket_id of the best match, or null>,
  "similarity_score": <integer 0-100, how identical the core problem is>,
  "reason": "one sentence citing the specific shared system and symptoms"
}
`.trim();

        const response3 = await ollama.chat({
          model:    this.modelName,
          format:   "json",
          messages: [{ role: "user", content: call3Prompt }],
          options:  { temperature: 0.1 },
        });

        const data3 = JSON.parse(response3.message.content);
        console.log("[AI] Call 3 result:", data3);

        const MERGE_THRESHOLD = 80;

        if (
          data3.should_merge &&
          data3.parent_ticket_id &&
          (data3.similarity_score ?? 0) >= MERGE_THRESHOLD
        ) {
          await prisma.suggestedMerge.upsert({
            where: {
              suggested_parent_id_suggested_child_id: {
                suggested_parent_id: data3.parent_ticket_id,
                suggested_child_id:  ticketId,
              },
            },
            update: { similarity_reason: data3.reason },
            create: {
              suggested_parent_id: data3.parent_ticket_id,
              suggested_child_id:  ticketId,
              similarity_reason:   data3.reason,
            },
          });

          console.log(
            `[AI] Merge suggested: parent=#${data3.parent_ticket_id} child=#${ticketId} score=${data3.similarity_score}`
          );
        } else {
          console.log(
            `[AI] No merge suggested for ticket #${ticketId} (score=${data3.similarity_score ?? "n/a"})`
          );
        }
      }

    } catch (error) {
      console.error("[AI] processTicketFull error:", error);
      throw error;
    }
  }
}

export const aiService = new AiService();