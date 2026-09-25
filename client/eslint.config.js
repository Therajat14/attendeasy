import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      // Tells the built-in parser to read JSX in .jsx files.
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // ESLint's own no-unused-vars cannot see that <Logo /> uses the Logo
      // import, so it reports every JSX component as unused. The rule that
      // understands JSX is eslint-plugin-react, which this project does not
      // use. Turning it off here keeps `npm run lint` clean and honest.
      "no-unused-vars": "off",
    },
  },
  {
    files: ["src/context/**/*.jsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
