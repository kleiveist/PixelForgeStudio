import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 40
            },
            {
              name: "forms-vendor",
              test: /node_modules[\\/](?:@hookform|react-hook-form|zod)[\\/]/,
              priority: 30
            },
            {
              name: "archive-vendor",
              test: /node_modules[\\/]fflate[\\/]/,
              priority: 30
            },
            {
              name: "animation-studio",
              test: /src[\\/](?:domain[\\/]animation|features[\\/]animation-|services[\\/]animation|store[\\/]animation|workers[\\/])/,
              maxSize: 450 * 1024,
              priority: 20
            },
            {
              name: "prompt-features",
              test: /src[\\/]features[\\/](?!animation-|studio-handoff)/,
              maxSize: 450 * 1024,
              priority: 10
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
              maxSize: 450 * 1024,
              priority: 1
            }
          ]
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  }
});
