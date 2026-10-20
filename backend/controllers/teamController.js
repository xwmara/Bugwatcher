import db from '../models/index.js';

const { Team, User } = db;

/**
 * Creează o echipă nouă
 * @route POST /teams
 * @param {Object} req.body - {name, description}
 * @returns {Object} echipa creată
 */

export const createTeam = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Team name is required." });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Only MPs can create teams
        if (user.role !== "MP") {
            return res.status(403).json({ message: "Only MP users can create teams." });
        }

        const existingTeam = await user.getTeam();
        if (existingTeam) {
            return res.status(400).json({ message: "User already belongs to a team." });
        }

        const isNewTeam = await Team.findOne({ where: { name } });
        if (isNewTeam) {
            return res.status(400).json({ message: "Team name already taken." });
        }

        const newTeam = await Team.create({ name, description });
        user.teamId = newTeam.id;
        await user.save();

        return res.status(201).json(newTeam);


    } catch (err) {
        return next(err);
    }
}

/**
 * Ia toate echipele
 * @route GET /teams
 * @returns {Object[]} lista de echipe
 */

export const getAllTeams = async (req, res, next) => {
    try {
        const teams = await Team.findAll({
            include: [{
                model: User,
                attributes: ['id', 'email', 'role']
            }]
        });
        return res.status(200).json(teams);

    } catch (err) {
        return next(err);
    }

}

/**
 * Obține echipa curentă a utilizatorului autentificat
 * @route GET /teams/my
 * @returns {Object} echipa utilizatorului
 */
export const getMyTeam = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(403).json({ message: "Unauthorized." });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (!user.teamId) {
            return res.status(200).json({ team: null });
        }

        const team = await Team.findByPk(user.teamId, {
            include: [{
                model: User,
                attributes: ['id', 'email', 'role']
            }]
        });
        return res.status(200).json(team);
    } catch (err) {
        return next(err);
    }
};

/**
 * Invită un utilizator în echipa curentă
 * @route POST /teams/invite
 * @param {Object} req.body - {email}
 * @returns {Object} mesaj de succes
 */
export const inviteToTeam = async (req, res, next) => {
    try {
        const inviterId = req.user?.id;
        if (!inviterId) return res.status(403).json({ message: "Unauthorized." });

        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });

        const inviter = await User.findByPk(inviterId);
        if (!inviter) return res.status(404).json({ message: "Inviter not found." });

        if (inviter.role !== "MP") {
            return res.status(403).json({ message: "Only MP users can invite members." });
        }

        if (!inviter.teamId) {
            return res.status(400).json({ message: "You must be in a team to invite others." });
        }

        const invitee = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (!invitee) {
            return res.status(404).json({ message: "User with this email not found." });
        }

        if (invitee.teamId) {
            return res.status(400).json({ message: "User already belongs to a team." });
        }

        // Only allow inviting other MPs
        if (invitee.role !== "MP") {
            return res.status(400).json({ message: "Only MP users can be invited to teams." });
        }

        invitee.teamId = inviter.teamId;
        await invitee.save();

        return res.status(200).json({ message: "User invited successfully." });

    } catch (err) {
        return next(err);
    }
};

/**
 * Părăsește echipa curentă
 * @route POST /teams/leave
 * @returns {Object} mesaj de succes
 */
export const leaveTeam = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(403).json({ message: "Unauthorized." });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (!user.teamId) {
            return res.status(400).json({ message: "You are not in a team." });
        }

        user.teamId = null;
        await user.save();

        return res.status(200).json({ message: "Left team successfully." });
    } catch (err) {
        return next(err);
    }
};
