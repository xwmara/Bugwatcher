import type { BugStatus, Severity } from "../types";

// Bug values used across the UI (same as the API and the database)
export const STATUSES: BugStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const STATUS_LABELS: Record<BugStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// Used to sort the most urgent bugs first
export const SEVERITY_RANK: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
