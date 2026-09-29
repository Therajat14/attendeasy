import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import authRoutes from "./routes/auth.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Prints every request as it comes in, so you can follow what the API is doing.
app.use((req, res, next) => {
  console.log(req.method + " " + req.url);
  next();
});

// The browser is on a different port than the API, so it needs CORS.
//
// We cannot answer with "*" when credentials are allowed, because the browser
// rejects that combination. Instead we list the exact frontend URLs we accept,
// and the browser receives back the one it asked from.
//
// FRONTEND_URL can hold more than one address, separated by commas.
const allowedOrigins = [];
const frontendUrlSetting = process.env.FRONTEND_URL || "http://localhost:5173";

for (const origin of frontendUrlSetting.split(",")) {
  const trimmedOrigin = origin.trim();

  if (trimmedOrigin) {
    allowedOrigins.push(trimmedOrigin);
  }
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// express.json() reads the body of a request and turns the JSON into an object
// we can use as req.body.
app.use(express.json());

// cookieParser turns the Cookie header into a plain object: req.cookies
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

// The built frontend. It is here in the Docker image and missing when the two
// halves are deployed separately. Serving it from this same process lets one
// container host the whole project, and the browser only ever talks to one
// address.
const clientFolder = path.resolve(__dirname, "../../client/dist");
const clientIndexFile = path.join(clientFolder, "index.html");
const hasBuiltClient = fs.existsSync(clientIndexFile);

if (hasBuiltClient) {
  // Serves files such as index.html, the JavaScript bundle and the images.
  app.use(express.static(clientFolder));

  app.use((req, res, next) => {
    // React Router owns the page URLs, so anything that is not an API call and
    // not a real file has to answer with index.html and let the router decide
    // what to show.
    if (req.method !== "GET") {
      return next();
    }

    if (req.path.startsWith("/api/")) {
      return next();
    }

    res.sendFile(clientIndexFile);
  });
} else {
  // No frontend to serve, so the API says hello instead.
  app.get("/", (req, res) => {
    res.send("AttendEasy API is running");
  });
}

app.use(errorHandler);

export default app;
