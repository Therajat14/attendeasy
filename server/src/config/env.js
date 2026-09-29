import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Turns the settings in server/.env into process.env values.
//
// It has to be loaded before anything that reads process.env while that file is
// being imported, so keep this import at the very top of server.js. That is why
// it is a module of its own: ES modules run their imports in the order they are
// written, and plain code in a file cannot run before its own imports.
//
// The path is worked out from this file rather than from the current folder, so
// server/.env is found however the server was started.

const here = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(here, "../../.env") });
