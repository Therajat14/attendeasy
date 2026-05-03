import mongoose from "mongoose";

const attendanceStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const attendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lectureName: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now, index: true },
    formToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    students: {
      type: [attendanceStudentSchema],
      default: [],
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ teacherId: 1, date: -1 });
attendanceSchema.index({ teacherId: 1, isActive: 1 });
attendanceSchema.index({ course: 1, class: 1, section: 1, isActive: 1 });

export default mongoose.model("Attendance", attendanceSchema);
