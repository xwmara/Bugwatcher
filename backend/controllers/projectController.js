import db from "../models/index.js";
import { isValidRepoLink } from "../utils/repoLink.js";

const { Project, User, Team, Bug } = db;

/**
 * Un tester (TST) se alătură unui proiect
 * @route POST /projects/:id/join
 */
export const joinProject = async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const userId = req.user?.id;

        if (!userId) return res.status(403).json({ message: "Unauthorized." });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const project = await Project.findByPk(projectId);
        if (!project) return res.status(404).json({ message: "Project not found." });

        // Only TST users should use this endpoint to join as testers
        if (user.role !== "TST") {
            return res.status(403).json({ message: "Only tester (TST) users can join projects as testers." });
        }

        // Check membership
        const alreadyMember = await project.hasUser(user);
        if (alreadyMember) {
            return res.status(200).json({ message: "User already member of the project." });
        }

        await project.addUser(user);
        return res.status(200).json({ message: "Joined project successfully." });
    } catch (err) {
        return next(err);
    }
}

/**
 * Creează un proiect nou
 * @route POST /projects
 * @param {Object} req.body - {title, commit_link}
 * @returns {Object} un obiect care contine mesajul de succes, proiectul creat și owner-ul proiectului
 */

export const createProject = async (req, res, next) => {
   
    // The project can either have a USER or TEAM as owner. 
    // We check if the userId belongs to a team
    // If yes, set owner_type to TEAM and owner_id to the user's team.
     
    try {
        const { title, commit_link } = req.body;
        const id = req.user.id;

        if (!id) {
            return res.status(403).json({ message: "Forbidden." });
        }
        // const user = req.user;
        const userExists = await User.findByPk(id);
        if (!userExists) {
            return res.status(404).json({ message: "User not found." });
        }

        if (userExists.role === "TST") {
            return res.status(403).json({ message: "Unauthorized. Tester roles cannot create projects." });
        }
        const team = await userExists.getTeam();
        let ownerId, ownerType;

        if (!isValidRepoLink(commit_link)) {
            return res.status(400).json({
                message: "Commit link must be an https:// link to GitHub, GitLab or Bitbucket."
            });
        }


        if (team) {
            ownerType = "TEAM";
            ownerId = team.id; // TeamID;
        } else {
            ownerType = "USER";
            ownerId = userExists.id;
        }


        const newProject = await Project.create({
            title,
            commit_link,
            owner_type: ownerType,
            owner_id: ownerId
        });
        await newProject.addUser(userExists);
        await userExists.addProject(newProject);
        let projectOwner;
        if (newProject.owner_type === "USER") {
            projectOwner = await User.findByPk(newProject.owner_id, {
                attributes: { exclude: ["password"] }
            });
        } else {
            projectOwner = await Team.findByPk(newProject.owner_id);
        }

        return res.status(201).json({
            message: "Project created successfully.",
            project: newProject,
            owner: projectOwner
        });

    } catch (err) {
        return next(err);
    }
}

/**
 * Ia toate proiectele
 * @route GET /projects
 * @returns {Object[]} lista de proiecte
 */

export const getAllProjects = async (req, res, next) => {
    try {
        const projects = await Project.findAll();
        return res.status(200).json(projects);
    } catch (err) {
        return next(err);
    }
}

/**
 * Ia un proiect după ID
 * @route GET /projects/:id
 * @returns {Object} proiectul, populat cu Users si Bugs.
 */


export const getProjectById = async (req, res, next) => {
    try {   
        const { id } = req.params;
        const project = await Project.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "Users",
                    attributes: { exclude: ["password"] },
                    through: { attributes: [] }
                },
                {
                    model: Bug,
                    as: "bugs"  
                }
            ]
        })
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }
        // Resolve owner (USER or TEAM) and attach as Owner for frontend convenience
        let projectJson = project.toJSON ? project.toJSON() : project;
        let projectOwner = null;
        try {
          if (projectJson.owner_type === 'USER') {
            projectOwner = await User.findByPk(projectJson.owner_id, { attributes: ['id', 'email', 'role'] });
          } else if (projectJson.owner_type === 'TEAM') {
            projectOwner = await Team.findByPk(projectJson.owner_id);
          }
        } catch (e) {
          // ignore
        }

        return res.status(200).json({ ...projectJson, Owner: projectOwner });
    } catch (err) {
        return next(err);
    }
}
