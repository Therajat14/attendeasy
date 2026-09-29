#!/bin/sh
# Runs on every container start: wait for MongoDB, seed it the first time only,
# then hand over to the API as PID 1 so it receives SIGTERM from `docker stop`.

set -e

MAX_ATTEMPTS="${MONGO_MAX_ATTEMPTS:-30}"
RETRY_DELAY_SECONDS="${MONGO_RETRY_DELAY_SECONDS:-2}"

# The API refuses to boot without a database, and the seeder cannot run either,
# so give MongoDB time to accept connections. Compose already waits for the
# healthcheck, but this also covers a bare `docker run` where the two containers
# start together.
if [ -n "$MONGO_URI" ]; then
  echo "Waiting for MongoDB (up to ${MAX_ATTEMPTS} tries)..."

  ATTEMPT=1
  while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
    # --input-type=module lets this -e snippet use ESM, which is what the
    # project and mongoose 9 both expect.
    if node --input-type=module -e "
      import mongoose from 'mongoose';
      try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        await mongoose.connection.close();
        process.exit(0);
      } catch {
        process.exit(1);
      }
    "; then
      echo "MongoDB is ready."
      break
    fi

    ATTEMPT=$((ATTEMPT + 1))
    if [ "$ATTEMPT" -gt "$MAX_ATTEMPTS" ]; then
      echo "MongoDB did not become ready in time." >&2
      exit 1
    fi

    echo "  attempt ${ATTEMPT} failed, retrying in ${RETRY_DELAY_SECONDS}s..."
    sleep "$RETRY_DELAY_SECONDS"
  done
fi

# Demo accounts, so a fresh `docker compose up` gives you something to log into
# straight away. Turn it off with AUTO_SEED=false to start on an empty database,
# and note that it only ever writes to a database with no users in it.
if [ "${AUTO_SEED:-true}" = "true" ]; then
  echo "Seeding demo data (skipped when the database already has users)..."
  npm run --silent seed:if-empty
fi

echo "Starting AttendEasy on port ${PORT:-5000}..."

# exec replaces this shell with Node, which lets the graceful shutdown in
# server.js run when the container is stopped.
exec "$@"
