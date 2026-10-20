import jwt from "jsonwebtoken";

export const verifyAccessToken = (req, res, next) => {
    const token = req.cookies.accessToken;
    
    if (!token) {
        return res.status(401).json({ message: "Not authenticated." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // 401 = not authenticated (expired or invalid token); 403 is for "authenticated but not allowed"
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}