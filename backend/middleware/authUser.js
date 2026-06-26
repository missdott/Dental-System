import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
    try {
        // Accept token from either `Authorization: Bearer <token>` OR `token: <token>` header
        const authHeader = req.headers.authorization || null;
        const tokenHeader = req.headers.token || null;

        console.log("authUser middleware - headers:", {
            authorization: authHeader,
            token: tokenHeader
        });

        let token = null;

        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
            console.log("authUser middleware - extracted token from Authorization header");
        } else if (tokenHeader) {
            token = tokenHeader;
            console.log("authUser middleware - extracted token from token header");
        } else {
            return res.status(401).json({ success: false, message: "No token. Please login." });
        }

        console.log("authUser middleware - token length:", token ? token.length : 0);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded:", decoded);

        req.userId = decoded.id || decoded._id;
        console.log("Set req.userId =", req.userId);

        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Invalid token payload" });
        }

        next();

    } catch (error) {
        console.log("Auth error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export default authUser;