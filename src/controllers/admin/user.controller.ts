import { Request, Response } from "express";
import * as db from "../../repositories";

const VALID_ROLES = ["ADMIN", "ASSIGNEE", "USER"];

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ error: "Role is required" });
      return;
    }
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
      return;
    }

    const user = await db.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updatedUser = await db.updateUserRole(userId, role);
    res.json({
      message: "User role updated successfully",
      user_id: updatedUser.user_id,
      email: updatedUser.email,
      name: updatedUser.full_name,
      role: updatedUser.role
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const getAssigneeScopes = async (req: Request, res: Response): Promise<void> => {
  try {
    const assigneeId = req.params.assigneeId;

    const assignee = await db.getUserById(assigneeId);
    if (!assignee) {
      res.status(404).json({ error: "Assignee not found" });
      return;
    }

    const scopes = await db.getAssigneeScopes(assigneeId);
    res.json({ message: "Assignee scopes retrieved successfully", assignee_id: assigneeId, scopes });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const addAssigneeScope = async (req: Request, res: Response): Promise<void> => {
  try {
    const assigneeId = req.params.assigneeId;
    const { scope_name } = req.body;

    if (!scope_name || typeof scope_name !== "string" || scope_name.trim().length === 0) {
      res.status(400).json({ error: "scope_name must be a non-empty string" });
      return;
    }

    const assignee = await db.getUserById(assigneeId);
    if (!assignee) {
      res.status(404).json({ error: "Assignee not found" });
      return;
    }

    const scope = await db.assignScope(assigneeId, scope_name.trim());
    res.status(201).json({ message: "Scope added to assignee successfully", scope });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const listAllScopes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const scopes = await db.getAllScopes();
    res.json({ scopes });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const removeAssigneeScope = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopeId = Number.parseInt(req.params.scopeId, 10);
    await db.removeScopeById(scopeId);
    res.json({ message: "Scope removed successfully", scope_id: scopeId });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    if (error.message?.includes("not found")) {
      res.status(404).json({ error: "Scope not found" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};
