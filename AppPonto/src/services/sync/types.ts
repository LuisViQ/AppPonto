export type SyncResult =
  | {
      status: "ok";
      pushed: number;
      pulled: number;
      warnings?: string[];
    }
  | {
      status: "skipped";
      reason: "offline" | "busy" | "missing_base_url";
    }
  | {
      status: "error";
      error: string;
    };

export type PendingAction = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at?: string;
};