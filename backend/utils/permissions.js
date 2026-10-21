// Returns true when the user may manage a project and its bugs:
// the user who owns the project, or a member of the team that owns it.
// The frontend uses the same rule to show the "Assign" section on the bug page.
export const canManageProject = (user, project) => {
    if (!user || !project) return false;
    if (project.owner_type === "USER") return project.owner_id === user.id;
    if (project.owner_type === "TEAM") return user.teamId != null && project.owner_id === user.teamId;
    return false;
};
