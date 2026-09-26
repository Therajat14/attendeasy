import cluster from "node:cluster";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import app from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// The platform gives us the port, so we never assume one.
const PORT = process.env.PORT || 5000;

// How long a worker may take to finish its in-flight requests on shutdown.
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000;

// How many worker processes to run. Nothing here is fixed to a particular
// machine: we read whatever the host gives us at runtime.
//
//   WEB_CONCURRENCY unset or "auto" -> one worker per available CPU
//   WEB_CONCURRENCY="4"              -> exactly four workers
//   WEB_CONCURRENCY="1"              -> no cluster, just this process
//
// WEB_CONCURRENCY is the variable Node hosting providers already set, so on a
// platform you can control the worker count without touching the code.
function resolveWorkerCount() {
  const setting = (process.env.WEB_CONCURRENCY || "auto").trim().toLowerCase();

  if (setting === "1") return 1;

  if (setting === "auto" || setting === "") {
    // availableParallelism() respects cgroup limits and CPU affinity, so inside
    // a container it reports the CPUs we were actually given rather than the
    // CPUs the underlying machine happens to have.
    return os.availableParallelism ? os.availableParallelism() : os.cpus().length;
  }

  const parsed = Number(setting);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

const workerCount = resolveWorkerCount();

// `cluster` cannot fork on Windows, so there we stay on a single process rather
// than pretend to be running a cluster.
const supportedPlatform = process.platform !== "win32";

// We only cluster when it is wanted, which keeps `npm run dev` and the test
// runs on one process: nodemon can restart a single process cleanly, and
// in-memory state such as the rate limiter is not split across workers.
// Production starts cluster, and so does any start where the platform has set
// WEB_CONCURRENCY for us.
const wantsCluster = Boolean(process.env.WEB_CONCURRENCY?.trim());
const isProduction = process.env.NODE_ENV === "production";
const useCluster =
  supportedPlatform && workerCount > 1 && (isProduction || wantsCluster);

// Runs inside every worker process. Each worker loads the app, opens its own
// MongoDB connection and listens on the same port. node:cluster shares the one
// listening socket between the workers, so the operating system spreads
// incoming connections across them for us.
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
  const shutdown = (signal) => {
    console.log(`Worker ${process.pid} received ${signal}, shutting down`);

    server.close(() => {
      disconnectFromDatabase().finally(() => process.exit(0));
    });

    // A client holding a keep-alive connection can keep server.close()
    // waiting, so we stop waiting after a while instead of hanging forever.
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Runs once in the primary process. Its only job is to keep workers alive.
function startPrimary() {
  console.log(`Primary ${process.pid} is starting ${workerCount} worker processes`);

  // Every worker gets its own copy of the app, its own MongoDB connection and
  // its own memory, so we pass it the worker count for anything that has to
  // behave the same across the cluster, such as the rate limiter.
  for (let i = 0; i < workerCount; i++) {
    cluster.fork({ WORKER_COUNT: String(workerCount) });
  }

  let shuttingDown = false;

  // Replace a worker that dies, so one crash does not reduce capacity.
  cluster.on("exit", (worker, code, signal) => {
    if (shuttingDown) {
      // Nothing left to supervise once the last worker is gone.
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

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`Primary received ${signal}, stopping all workers`);
    for (const worker of Object.values(cluster.workers)) worker.kill(signal);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

if (useCluster && cluster.isPrimary) {
  startPrimary();
} else {
  startWorker();
}
