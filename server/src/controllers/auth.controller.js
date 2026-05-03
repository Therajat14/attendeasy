import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.util.js";

// REGISTER
export const register = async (req, res) => {
  const { name, email, password, role, rollNo } = req.body;
  const normalizedRole = role || "student";
  const normalizedRollNo = Number(rollNo);

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  if (normalizedRole === "student" && (!Number.isInteger(normalizedRollNo) || normalizedRollNo < 1)) {
    return res.status(400).json({ message: "Roll number is required for students" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: normalizedRole,
    ...(normalizedRole === "student" ? { rollNo: normalizedRollNo } : {}),
  });
  const token = generateToken(user);

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
    },
    token,
  });
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
    },
    token,
  });
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  res.json(req.user);
};
