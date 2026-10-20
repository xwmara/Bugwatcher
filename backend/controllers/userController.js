import db from "../models/index.js";
import bcrypt from "bcrypt";
import zxcvbn from 'zxcvbn';
import createAccessToken from "../utils/createAccessToken.js";
import { accessOptions } from "../utils/cookiesConfig.js";

const { User, Project, Team } = db;

/**
 * Înregistrează un user (signup)
 * @route POST /users/register
 * @param {Object} req.body - {email, password, role}
 * @returns {Object} user creat
 */

export const registerUser = async (req, res, next) => {
  try {
    const {email, password, role} = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({message: "Email invalid."});
    }
    
    if (!password) {
      return res.status(400).json({message: "Password is required."});
    }
    const passStrength = zxcvbn(password);
    
    if (passStrength.score < 2) {
      return res.status(400).json({message: "Password too weak."});
    }
    
    if (role && role !== "MP" && role !== "TST") {
        return res.status(400).json({message: "Role invalid. Use MP or TST."});
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne(
      {where: {
        email: normalizedEmail
      },
      attributes: { exclude: ["password"] }
    });

    if (existingUser) {
      return res.status(409).json({message: "User with this email already exists."});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "TST"      
    })

    const userJson = newUser.toJSON();
    delete userJson.password;

    return res.status(201).json(userJson);

    } catch (err) {
      return next(err);
    }    

}

   /**
   * Loghează un user (login)
   * @route POST /users/login
   * @param {Object} req.body - {email, password}
   * @returns {Object} user logat
   */

  export const loginUser = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({message: "Email and password are required."});
      }
      
      const normalizedEmail = email.trim().toLowerCase();

      let existingUser = await User.findOne({
        where: {
          email: normalizedEmail,
        }
      })

      if (!existingUser) {
        return res.status(401).json({message: "Invalid email or password."});
      }

      const passwordMatch = await bcrypt.compare(password, existingUser.password);
      if (!passwordMatch) {
        return res.status(401).json({message: "Invalid email or password."});
      }
      const userJson = existingUser.toJSON();
      delete userJson.password;
      existingUser = userJson;
    
      
      if (!accessOptions) {
        return res.status(500).json({ message: "Cookie configuration error." });
      }

      const accessToken = createAccessToken(existingUser.id);
      res.cookie("accessToken", accessToken, accessOptions);
      res.status(200).json(existingUser);

    } catch (err) {
      return next(err);
    }

  }

  /**
  * Ia un user după ID
  * @route GET /users/:id
  * @param {string} id - ID-ul userului
  * @returns {Object} userul găsit
  */

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(user);

  } catch (err) {
    return next(err);
  }
};

  /**
  * Actualizează un user după ID
  * @route PUT /users/:id
  * @param {string} id - ID-ul userului
  * @param {Object} req.body - {email, role}
  * @returns {Object} user actualizat
  */

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    // Users can only change their own account
    if (Number(id) !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own account." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // The role is chosen at registration; otherwise a tester could make themselves an MP
    if (role !== undefined && role !== user.role) {
      return res.status(403).json({ message: "Role cannot be changed." });
    }

    if (email !== undefined) {
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Email invalid." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const emailTaken = await User.findOne({ where: { email: normalizedEmail } });
      if (emailTaken && emailTaken.id !== user.id) {
        return res.status(409).json({ message: "User with this email already exists." });
      }
      user.email = normalizedEmail;
    }

    await user.save();

    const userJson = user.toJSON();
    delete userJson.password;

    return res.status(200).json(userJson);
  } catch (err) {
    return next(err);
  }
};

/**
 * Loghează un user (logout)
 * @route POST /users/logout
 * @returns {Object} mesaj de succes
 */
export const logoutUser = async (req, res, next) => {
  try {
    // Browsers only delete a cookie when the same options are used as when it was set
    const { maxAge, ...clearOptions } = accessOptions;
    res.clearCookie("accessToken", clearOptions);
    return res.status(200).json({ message: "Logged out successfully." });

  } catch (err) {
    return next(err);
  }
}

/**
 * Șterge un user după ID
 * @route DELETE /users/:id
 * @param {string} id - ID-ul userului
 * @returns {void} fara continut(204 No Content)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Users can only delete their own account
    if (Number(id) !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own account." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.destroy();

    // The account no longer exists, so end the session too
    const { maxAge, ...clearOptions } = accessOptions;
    res.clearCookie("accessToken", clearOptions);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

/**
 * Recuperează datele userului logat
 * @route GET /users/me
 * @returns {Object} datele userului logat
 */

export const restoreUser = async (req, res, next) => {
  try {
    const id = req.user.id;
    if (!id) {
    
      return res.status(400).json({ message: "User ID missing in token." });
    
    };

    const user = await User.findByPk(id, { 
      attributes: { exclude: ["password"] }
    })
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(user);

  } catch (err) {
    return next(err);
  }
}

/**
 * Ia proiectele unui user
 * @route GET /users/projects
 * @returns {Object[]} lista de proiecte
 */
export const getUserProjects = async (req, res, next) => {
  try {
    const userID = req.user?.id;
    if (!userID) {
      return res.status(403).json({ message: "Unauthorized." });
    }
    const user = await User.findByPk(userID, {
      attributes: { include: ["id", "email", "role"] },
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    // Project members (MP owner/team members and testers who joined), without passwords
    const includeMembers = [{
      model: User,
      as: 'Users',
      attributes: ['id', 'email', 'role'],
      through: { attributes: [] }
    }];

    let projectsRaw;
    if (user.role === "MP") {
      // MPs see the projects they belong to
      projectsRaw = await user.getProjects({ include: includeMembers, joinTableAttributes: [] });
    } else if (user.role === "TST") {
      // Testers see all available projects, so they can join them
      projectsRaw = await Project.findAll({ include: includeMembers });
    } else {
      return res.status(400).json({ message: "Invalid user role." });
    }

    const projects = await Promise.all(projectsRaw.map(async (p) => {
      const proj = p.toJSON ? p.toJSON() : p;
      let owner = null;
      try {
        if (proj.owner_type === 'USER') {
          owner = await User.findByPk(proj.owner_id, { attributes: ['id', 'email', 'role'] });
        } else if (proj.owner_type === 'TEAM') {
          owner = await Team.findByPk(proj.owner_id);
        }
      } catch (e) {
        // ignore owner lookup errors and leave owner as null
      }

      // testers: emails of the TST members only (the MP owner is a member too, but not a tester)
      const testers = (proj.Users || []).filter(u => u.role === "TST").map(u => u.email);
      // whether requesting user already joined
      const joined = (proj.Users || []).some(u => u.id === userID);

      return { ...proj, Owner: owner, testers, joined };
    }));

    return res.status(200).json({ Projects: projects });

  } catch (err) {
    return next(err);
  }
};

