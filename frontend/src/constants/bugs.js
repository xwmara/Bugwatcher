// Bug values used across the UI (same as the API and the database)
export const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// Used to sort the most urgent bugs first
export const SEVERITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
