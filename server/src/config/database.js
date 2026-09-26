import mongoose from "mongoose";

export async function connectToDatabase() {
  const connectionString = process.env.MONGO_URI;

  if (!connectionString) {
    throw new Error("MONGO_URI is missing. Add it to server/.env");
  }

  await mongoose.connect(connectionString);
  console.log("Connected to MongoDB");
}

// Closes the connection on a clean shutdown, so a worker never exits while
// MongoDB still thinks it has an open client.
export async function disconnectFromDatabase() {
  await mongoose.connection.close();
  console.log("Disconnected from MongoDB");
}
