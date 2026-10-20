import db from "../models/index.js";
import { canManageProject } from "../utils/permissions.js";

const { Bug, User, Project } = db;

/**
 * Creează un bug nou
 * @route POST /bugs
 * @param {Object} req.body - {title, description, severity, priority, projectId, assignedUserId}
 * @returns {Object} bug creat
 */

export const createBug = async (req, res, next) => {

    try {
        const { title, description, severity, priority, projectId, assignedUserId } = req.body;
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
            reporterId: requesterId
        });

        return res.status(201).json(newBug);

    } catch (err) {
        return next(err);
    }
}

/**
 * Obține toate bug-urile unui proiect
 * @route GET /bugs/project/:projectId
 * @param {string} projectId - ID-ul proiectului
 * @returns {Object[]} lista de bug-uri asociate proiectului
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
 * Actualizează un bug existent
 * @route PUT /bugs/:id
 * @param {string} id - ID-ul bug-ului de actualizat
 * @param {Object} req.body - {title, description, severity, priority, status, assignedUserId}
 * @returns {Object} bug actualizat
 */
export const updateBug = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, severity, priority, status, assignedUserId } = req.body;

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
        for (const [field, value] of Object.entries({ title, description, severity, priority, status })) {
            if (value !== undefined) changes[field] = value; // description may be "" to clear it
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
 * Șterge un bug
 * @route DELETE /bugs/:id
 * @param {string} id - ID-ul bug-ului de șters
 * @returns {Object} mesaj de succes
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
 * Obține un bug după ID
 * @route GET /bugs/:id
 * @param {string} id - ID-ul bug-ului
 * @returns {Object} bug-ul găsit, cu reporter și assignedUser incluse
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


