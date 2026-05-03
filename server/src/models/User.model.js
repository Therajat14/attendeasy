import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    rollNo: {
      type: Number,
      min: 1,
      required: function () {
        return this.role === "student";
      },
    },
    course: {
      type: String,
      trim: true,
      required: function () {
        return this.role === "student";
      },
    },
    class: {
      type: String,
      trim: true,
      required: function () {
        return this.role === "student";
      },
    },
    section: {
      type: String,
      trim: true,
      required: function () {
        return this.role === "student";
      },
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
