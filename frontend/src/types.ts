// Shapes of the data returned by the API (see backend/models and controllers).

export type Role = "MP" | "TST";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Priority = "Low" | "Medium" | "High";
export type BugStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

// A user as returned by /users/me and /users/login (never includes the password)
export interface User {
  id: number;
  email: string;
  role: Role;
  teamId: number | null;
}

// Short user info included in projects, bugs and teams
export interface UserSummary {
  id: number;
  email: string;
  role: Role;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  Users?: UserSummary[];
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  commit_link: string;
  owner_type: "USER" | "TEAM";
  owner_id: number;
  // Added by the API: the owning user or team
  Owner?: UserSummary | Team | null;
  // Members of the project (owner and testers who joined)
  Users?: UserSummary[];
  // Only in /users/getUserProjects
  testers?: string[];
  joined?: boolean;
}

export interface Bug {
  id: number;
  title: string;
  description: string | null;
  severity: Severity;
  priority: Priority;
  status: BugStatus;
  projectId: number;
  assignedUserId: number | null;
  reporterId: number | null;
  commitLink: string | null;
  resolutionCommit: string | null;
  // Included by GET /bugs/:id and GET /bugs/project/:projectId
  assignedUser?: UserSummary | null;
  reporter?: UserSummary | null;
}

// Data sent when a tester reports a bug
export interface NewBug {
  title: string;
  description: string;
  severity: Severity;
  priority: Priority;
  projectId: number;
  commitLink: string;
}
