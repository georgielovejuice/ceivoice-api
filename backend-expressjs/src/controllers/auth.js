const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authService = require("../services/auth");

exports.googleLogin = async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: "id_token required" });
    }

    const result = await authService.googleLogin(id_token);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid Google token" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: {
        user_id: true,
        email: true,
        name: true,
        role: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
