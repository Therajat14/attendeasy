import cluster from "node:cluster";
import os from "node:os";

import "./config/env.js";
import app from "./app.js";

import { connectToDatabase, disconnectFromDatabase } from "./config/database.js";

// ==========================================
// BASIC SETTINGS
// ==========================================

const PORT = process.env.PORT || 5000;

const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000;

// ==========================================
// WORKER COUNT
// ==========================================

function getWorkerCount() {
  const setting = (process.env.WEB_CONCURRENCY || "auto").trim().toLowerCase();

  // "1" means run only one process
  if (setting === "1") {
    return 1;
  }

  // "auto" means use all available CPUs
  if (setting === "auto" || setting === "") {
    return os.availableParallelism();
  }

  // Example: WEB_CONCURRENCY=4
  const number = Number(setting);

  if (Number.isInteger(number) && number > 0) {
    return number;
  }

  // Invalid value -> use one worker
  return 1;
}

const workerCount = getWorkerCount();

// ==========================================
// CREATE A WORKER
// ==========================================

function createWorker() {
  /*
    WORKER_COUNT is passed to the worker.

    This is useful for things like the rate limiter.

    Example:

    4 workers
    ↓
    each worker knows there are 4 workers
  */

  cluster.fork({
    WORKER_COUNT: String(workerCount),
  });
}

// ==========================================
// WORKER PROCESS
// ==========================================

async function startWorker() {
  try {
    // Every worker needs its own MongoDB connection
    await connectToDatabase();
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);

    process.exit(1);
  }

  // Start Express
  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is running on port ${PORT}`);
  });

  // ------------------------------------------
  // WORKER SHUTDOWN
  // ------------------------------------------

  function shutdown(signal) {
    console.log(`Worker ${process.pid} received ${signal}, shutting down`);

    /*
      Stop accepting new requests.

      Existing requests are allowed to finish.
    */

    server.close(() => {
      disconnectFromDatabase().finally(() => {
        process.exit(0);
      });
    });

    /*
      If some connection never closes,
      don't wait forever.
    */

    setTimeout(() => {
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
  }

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });

  // Handle shutdown from hosting platform
  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
}

// ==========================================
// PRIMARY PROCESS
// ==========================================

function startPrimary() {
  console.log(`Primary ${process.pid} is starting ${workerCount} worker processes`);

  // Create workers
  for (let i = 0; i < workerCount; i++) {
    createWorker();
  }

  /*
    This becomes true when the server is shutting down.

    We use it so that workers are NOT recreated
    while the application is shutting down.
  */

  let isShuttingDown = false;

  // ------------------------------------------
  // WORKER CRASH HANDLING
  // ------------------------------------------

  cluster.on("exit", (worker, code, signal) => {
    // If the application is shutting down,
    // don't create another worker.
    if (isShuttingDown) {
      const workersStillRunning = Object.keys(cluster.workers).length;

      if (workersStillRunning === 0) {
        console.log("All workers stopped, primary is exiting");

        process.exit(0);
      }

      return;
    }

    // A worker crashed while the server was running.
    console.log(
      `Worker ${worker.process.pid} exited ` +
        `(${signal || code}), starting a replacement`,
    );

    // Create a new worker
    createWorker();
  });

  // ------------------------------------------
  // PRIMARY SHUTDOWN
  // ------------------------------------------

  function shutdown(signal) {
    // Ignore another shutdown signal
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    console.log(`Primary received ${signal}, stopping all workers`);

    // Tell every worker to shut down
    for (const worker of Object.values(cluster.workers)) {
      worker.kill(signal);
    }
  }

  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
}

// ==========================================
// SHOULD WE USE CLUSTER?
// ==========================================

const isProduction = process.env.NODE_ENV === "production";

const isNotWindows = process.platform !== "win32";

/*
  If WEB_CONCURRENCY exists, the hosting platform
  is telling us how many workers it wants.
*/

const platformAskedForWorkers = Boolean(process.env.WEB_CONCURRENCY);

/*
  Cluster is used when:

  1. We are NOT on Windows
  2. We have more than one worker
  3. We are in production
     OR
     WEB_CONCURRENCY was provided
*/

const shouldStartCluster =
  isNotWindows && workerCount > 1 && (isProduction || platformAskedForWorkers);

// ==========================================
// START APPLICATION
// ==========================================

if (shouldStartCluster && cluster.isPrimary) {
  // Start primary process
  startPrimary();
} else {
  // Start normal Express worker
  startWorker();
}
