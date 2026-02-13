import express from "express";

import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;
