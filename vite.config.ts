import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { createRequire } from "node:module";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const decorators = require("@babel/plugin-proposal-decorators");

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      plugins: [[decorators, { version: "2023-11" }]],
      presets: [reactCompilerPreset()],
    }),
  ],
});
