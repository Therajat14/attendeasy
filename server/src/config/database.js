import mongoose from "mongoose";

export async function connectToDatabase() {
  const connectionString = process.env.MONGO_URI;

  if (!connectionString) {
    throw new Error("MONGO_URI is missing. Add it to server/.env");
  }

  await mongoose.connect(connectionString);
  console.log("Connected to MongoDB");
}
