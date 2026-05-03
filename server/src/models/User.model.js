import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    section: { type: String, trim: true, default: "" },
    rollNo: { type: Number, required: true },
  },
  { _id: false, timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "cr", "admin"],
      default: "student",
    },
    formToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    formTokenExpiresAt: {
      type: Date,
    },
    students: {
      type: [studentSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
