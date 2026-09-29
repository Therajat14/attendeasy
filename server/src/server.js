import cluster from "node:cluster";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import app from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from "./config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// The hosting platform tells us the port, so we never guess one.
const PORT = process.env.PORT || 5000;

// How long a worker may spend finishing its in-flight requests before we stop
// waiting and shut it down anyway.
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000;

// How many worker processes to run. We read this from the environment because
// it is the same variable hosting providers already set:
//
//   WEB_CONCURRENCY="1"              -> no cluster at all, just this process
//   WEB_CONCURRENCY="4"              -> exactly four workers
//   WEB_CONCURRENCY unset or "auto"  -> one worker for each CPU
function getWorkerCount() {
  const setting = (process.env.WEB_CONCURRENCY || "auto").trim().toLowerCase();

  if (setting === "1") {
    return 1;
  }

  if (setting === "auto" || setting === "") {
    // availableParallelism() respects CPU limits set on the machine, so inside a
    // container it reports the CPUs we were actually given.
    if (os.availableParallelism) {
      return os.availableParallelism();
    }
    return os.cpus().length;
  }

  const typedNumber = Number(setting);

  if (Number.isInteger(typedNumber) && typedNumber > 0) {
    return typedNumber;
  }

  return 1;
}

const workerCount = getWorkerCount();
const isProduction = process.env.NODE_ENV === "production";

// node:cluster cannot fork processes on Windows, so there we simply stay as one
// process instead of pretending to run a cluster.
const canUseCluster = process.platform !== "win32";

// We only start a cluster when we are in production, or when the platform has
// set WEB_CONCURRENCY for us. That keeps `npm run dev` on a single process,
// which is easier for nodemon to restart, and keeps the in-memory rate limiter
// in one place.
const shouldUseCluster =
  canUseCluster &&
  workerCount > 1 &&
  (isProduction || Boolean(process.env.WEB_CONCURRENCY));

// Runs inside every worker process. Each worker loads the app, opens its own
// MongoDB connection and listens on the same port. node:cluster shares the one
// listening socket between the workers, so the operating system spreads incoming
// connections across them for us.
async function startWorker() {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is running on port ${PORT}`);
  });

  // Stop accepting new connections, let the requests already in flight finish,
  // and only then close MongoDB.
  function shutdown(signal) {
    console.log(`Worker ${process.pid} received ${signal}, shutting down`);

    server.close(() => {
      disconnectFromDatabase().finally(() => process.exit(0));
    });

    // A client holding a keep-alive connection can keep server.close() waiting
    // forever, so we stop waiting after a while instead of hanging.
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Runs once in the primary process. Its only job is to keep workers alive.
function startPrimary() {
  console.log(`Primary ${process.pid} is starting ${workerCount} worker processes`);

  // Every worker gets its own copy of the app, its own MongoDB connection and
  // its own memory. The worker count is passed along for anything that has to
  // behave the same across the cluster, such as the rate limiter.
  for (let i = 0; i < workerCount; i++) {
    cluster.fork({ WORKER_COUNT: String(workerCount) });
  }

  // Remembers that we are on our way out, so a worker dying during shutdown
  // does not get replaced by a new one.
  let isShuttingDown = false;

  // Replace a worker that dies, so one crash does not reduce capacity.
  cluster.on("exit", (worker, code, signal) => {
    if (isShuttingDown) {
      // Once the last worker is gone there is nothing left to supervise.
      if (Object.keys(cluster.workers).length === 0) {
        console.log("All workers stopped, primary is exiting");
        process.exit(0);
      }
      return;
    }

    console.log(
      `Worker ${worker.process.pid} exited (${signal || code}), starting a replacement`,
    );
    cluster.fork({ WORKER_COUNT: String(workerCount) });
  });

  function shutdown(signal) {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Primary received ${signal}, stopping all workers`);

    for (const worker of Object.values(cluster.workers)) {
      worker.kill(signal);
    }
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

if (shouldUseCluster && cluster.isPrimary) {
  startPrimary();
} else {
  startWorker();
}
