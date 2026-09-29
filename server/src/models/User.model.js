import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Marks a field as required, but only for students. Teachers, class reps and
// admins have no roll number, course, year or section.
//
// Mongoose calls this function with `this` set to the document being saved, so
// reading `this.role` is how we find out who is signing up.
function requiredForStudents() {
  return function () {
    return this.role === "student";
  };
}

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
      required: requiredForStudents(),
    },
    course: {
      type: String,
      trim: true,
      required: requiredForStudents(),
    },
    class: {
      type: String,
      trim: true,
      required: requiredForStudents(),
    },
    section: {
      type: String,
      trim: true,
      required: requiredForStudents(),
    },
  },
  { timestamps: true },
);

// Hash the password before saving it, so the plain text is never stored.
// This only runs when the password field actually changed.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Checks a password someone typed against the hash we stored.
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
