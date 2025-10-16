import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment setup
    environment: "jsdom",

    // Setup files
    setupFiles: ["./vitest.setup.ts"],

    // Global test configuration
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        ".astro/",
        "**/*.config.*",
        "**/*.d.ts",
        "**/types.ts",
        "**/__tests__/**",
        "**/tests/**",
      ],
      // Coverage thresholds - adjust as needed
      // Set to 0 to not fail CI, but still collect coverage metrics
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },

    // Test file patterns
    include: [
      "**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".astro", "tests/e2e"],
  },

  // Path resolution
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/db": path.resolve(__dirname, "./src/db"),
      "@/types": path.resolve(__dirname, "./src/types.ts"),
    },
  },
});
