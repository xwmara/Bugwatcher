import db from "../models/index.js";
import { canManageProject } from "../utils/permissions.js";

const { Bug, User, Project } = db;

/**
 * Creates a new bug (reported by the logged-in user)
 * @route POST /bugs
 * @param {Object} req.body - {title, description, severity, priority, projectId, assignedUserId}
 * @returns {Object} the created bug
 */

export const createBug = async (req, res, next) => {

    try {
        const { title, description, severity, priority, projectId, assignedUserId, commitLink } = req.body;
        const requesterId = req.user?.id;

        if (!requesterId) return res.status(403).json({ message: "Unauthorized." });
        // Required fields and allowed values are checked by validate(createBugBody)

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }
        const requester = await User.findByPk(requesterId);
        if (!requester) return res.status(404).json({ message: "Requesting user not found." });

        // If requester is a tester, ensure they have joined the project
        if (requester.role === "TST") {
            const isMember = await project.hasUser(requester);
            if (!isMember) {
                return res.status(403).json({ message: "Tester must join project before reporting bugs." });
            }
        }

        if (assignedUserId) {
            const assignedUser = await User.findByPk(assignedUserId);
            if (!assignedUser) {
                return res.status(404).json({ message: "Assigned user not found." });
            }
        }
        let status = "OPEN";
        
        // Create bug (persist reporterId)
        const newBug = await Bug.create({
            title,
            description,
            severity,
            priority,
            status,
            projectId,
            assignedUserId: assignedUserId || null,
            reporterId: requesterId,
            commitLink: commitLink ?? null
        });

        return res.status(201).json(newBug);

    } catch (err) {
        return next(err);
    }
}

/**
 * Gets all bugs of a project
 * @route GET /bugs/project/:projectId
 * @param {string} projectId - project ID
 * @returns {Object[]} the bugs of the project
 */
export const getBugsByProjectId = async (req, res, next) => {
    try {
        const { projectId } = req.params; 

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }
        const bugs = await Bug.findAll({
            where: { projectId: projectId },
            include: [
                {
                    model: User,
                    as: 'assignedUser', 
                    attributes: ['id', 'email', 'role'] 
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'email', 'role']
                }
            ]
        });

        return res.status(200).json(bugs);
    } catch (err) {
        return next(err);
    }
};

/**
 * Updates a bug (project owner or a member of the owning team only)
 * @route PUT /bugs/:id
 * @param {string} id - ID of the bug to update
 * @param {Object} req.body - {title, description, severity, priority, status, assignedUserId}
 * @returns {Object} the updated bug
 */
export const updateBug = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, severity, priority, status, assignedUserId, resolutionCommit } = req.body;

        const bug = await Bug.findByPk(id);
        if (!bug) {
            return res.status(404).json({ message: "Bug not found." });
        }

        // Only the project owner (or a member of the owning team) can change a bug
        const project = await Project.findByPk(bug.projectId);
        const requester = await User.findByPk(req.user.id);
        if (!canManageProject(requester, project)) {
            return res.status(403).json({ message: "Only the project owner can update this bug." });
        }

        // Only the fields sent in the request are changed.
        // Their format and allowed values are checked by validate(updateBugBody).
        const changes = {};
        for (const [field, value] of Object.entries({ title, description, severity, priority, status, resolutionCommit })) {
            if (value !== undefined) changes[field] = value; // description may be "" to clear it
        }

        // Resolving a bug requires the commit that fixed it
        const newStatus = changes.status ?? bug.status;
        const newResolutionCommit = changes.resolutionCommit !== undefined ? changes.resolutionCommit : bug.resolutionCommit;
        if (newStatus === "RESOLVED" && !newResolutionCommit) {
            return res.status(400).json({ message: "Add the commit that fixed the bug to mark it as RESOLVED." });
        }
        // Reopening a bug removes the old fix
        if (changes.status === "OPEN" || changes.status === "IN_PROGRESS") {
            changes.resolutionCommit = null;
        }

        if (assignedUserId === null) {
            changes.assignedUserId = null; // unassign
        } else if (assignedUserId !== undefined) {
            const userExists = await User.findByPk(assignedUserId);
            if (!userExists) {
                return res.status(404).json({ message: "New assigned user not found." });
            }
            // Same rule as the bug page: bugs are assigned to MP members of the project
            const isMember = await project.hasUser(userExists);
            if (userExists.role !== "MP" || !isMember) {
                return res.status(400).json({ message: "Bugs can only be assigned to MP members of the project." });
            }
            changes.assignedUserId = userExists.id;
        }

        await bug.update(changes);

        return res.status(200).json({ message: "Bug updated successfully", bug });
    } catch (err) {
        return next(err);
    }
};

/**
 * Deletes a bug (project owner or a member of the owning team only)
 * @route DELETE /bugs/:id
 * @param {string} id - ID of the bug to delete
 * @returns {Object} success message
 */
export const deleteBug = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bug = await Bug.findByPk(id);
        if (!bug) {
            return res.status(404).json({ message: "Bug not found." });
        }

        // Only the project owner (or a member of the owning team) can delete a bug
        const project = await Project.findByPk(bug.projectId);
        const requester = await User.findByPk(req.user.id);
        if (!canManageProject(requester, project)) {
            return res.status(403).json({ message: "Only the project owner can delete this bug." });
        }

        await bug.destroy();
        return res.status(200).json({ message: "Bug deleted successfully." });
    } catch (err) {
        return next(err);
    }
};

/**
 * Gets a bug by ID
 * @route GET /bugs/:id
 * @param {string} id - bug ID
 * @returns {Object} the bug, with reporter and assignedUser included
 */
export const getBugById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const bug = await Bug.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'assignedUser',
                    attributes: ['id', 'email', 'role']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'email', 'role']
                }
            ]
        });
        if (!bug) {
            return res.status(404).json({ message: "Bug not found." });
        }
        return res.status(200).json(bug);
    } catch (err) {
        return next(err);
    }
};


