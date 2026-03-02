// ===== AUTH TYPES =====

/** Payload stored inside every JWT issued by the API. */
export interface JwtPayload {
  user_id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/** Payload used when signing access/refresh tokens. */
export interface TokenPayload {
  user_id: string;
  email: string;
  role: string;
}

/** Lean user object attached to req.user after authentication. */
export interface UserProfile {
  user_id: string;
  email: string;
  user_name: string | null;
  role: string;
}

/** Response returned by register/login endpoints. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

/** Payload inside tracking tokens used for anonymous request follow-up. */
export interface TrackingTokenPayload {
  email: string;
  request_id: number;
}

// ===== AI TYPES =====

/** Structured ticket draft produced by the AI service. */
export interface AiTicketDraft {
  title: string;
  category: string;
  summary: string;
  suggested_solution: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee_id: string | null;
}

// ===== EMAIL QUEUE TYPES =====

export interface EmailQueuePayload {
  type:
    | "confirmation"
    | "status_change"
    | "comment_notification"
    | "assignment_notification";
  email: string;
  data: Record<string, any>;
}

// ===== EXPRESS AUGMENTATION =====

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
      userId?: string;
      email?: string;
    }
  }
}
