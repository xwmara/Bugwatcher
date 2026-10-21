import type { Project } from "../types";

// A project's owner is a user (shown by email) or a team (shown by name)
export const getOwnerLabel = (project: Pick<Project, "Owner">): string => {
  const owner = project.Owner;
  if (!owner) return "—";
  return "email" in owner ? owner.email : owner.name;
};
