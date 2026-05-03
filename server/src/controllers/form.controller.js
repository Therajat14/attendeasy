import crypto from "crypto";
import User from "../models/User.model.js";

const DEFAULT_FORM_EXPIRY_HOURS = 24;

function getFrontendUrl() {
  return process.env.FRONTEND_URL || "https://your-frontend.com";
}

function getFormExpiryDate() {
  const configuredHours = Number(process.env.FORM_TOKEN_EXPIRY_HOURS);
  const expiryHours =
    Number.isFinite(configuredHours) && configuredHours > 0
      ? configuredHours
      : DEFAULT_FORM_EXPIRY_HOURS;

  return new Date(Date.now() + expiryHours * 60 * 60 * 1000);
}

function normalizeStudentPayload(body) {
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    class: typeof body.class === "string" ? body.class.trim() : "",
    section: typeof body.section === "string" ? body.section.trim() : "",
    rollNo: Number(body.rollNo),
  };
}

function isMissingRequiredStudentField(student) {
  return !student.name || !student.class || !Number.isInteger(student.rollNo);
}

export const generateFormLink = async (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers can generate form links" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = getFormExpiryDate();

  const teacher = await User.findById(req.user._id);
  if (!teacher) {
    return res.status(404).json({ message: "Teacher not found" });
  }

  teacher.formToken = token;
  teacher.formTokenExpiresAt = expiresAt;
  await teacher.save();

  const formUrl = `${getFrontendUrl().replace(/\/$/, "")}/form/${token}`;

  return res.status(201).json({
    message: "Form link generated successfully",
    formUrl,
    token,
    expiresAt,
  });
};

export const submitStudentForm = async (req, res) => {
  const { token } = req.params;
  const student = normalizeStudentPayload(req.body);

  if (isMissingRequiredStudentField(student)) {
    return res.status(400).json({
      message: "Name, class, and rollNo are required",
    });
  }

  const teacher = await User.findOne({
    role: "teacher",
    formToken: token,
    formTokenExpiresAt: { $gt: new Date() },
  });

  if (!teacher) {
    return res.status(404).json({ message: "Invalid or expired form token" });
  }

  const updatedTeacher = await User.findOneAndUpdate(
    {
      _id: teacher._id,
      students: {
        $not: {
          $elemMatch: {
            class: student.class,
            section: student.section,
            rollNo: student.rollNo,
          },
        },
      },
    },
    { $push: { students: student } },
    { new: true, runValidators: true },
  );

  if (!updatedTeacher) {
    return res.status(409).json({
      message: "Student already submitted for this class, section, and roll number",
    });
  }

  return res.status(201).json({
    message: "Student details submitted successfully",
    student,
  });
};
