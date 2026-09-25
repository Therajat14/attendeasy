import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from "./app.js";
import { connectToDatabase } from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 5000;

// We only start accepting requests once the database is reachable, so the API
// never answers a request it cannot finish.
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
  });
