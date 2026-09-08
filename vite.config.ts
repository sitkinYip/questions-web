import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
// Bootstrap imports run before Vite initializes its aliases.
import { createBuildInfo } from "./scripts/build-info.ts";
import { uiCopy } from "./src/config/ui-copy.ts";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const buildInfo = createBuildInfo(
    mode,
    process.env,
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  );

  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@scripts": fileURLToPath(new URL("./scripts", import.meta.url)),
        "@e2e": fileURLToPath(new URL("./e2e", import.meta.url)),
      },
    },
    define: { __APP_BUILD__: JSON.stringify(buildInfo) },
    base: env.VITE_PUBLIC_BASE || "/",
    plugins: [
      react(),
      {
        name: "ui-copy-metadata",
        transformIndexHtml(html) {
          const escapeHtml = (value: string) =>
            value
              .replaceAll("&", "&amp;")
              .replaceAll('"', "&quot;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;");
          return html
            .replace("__UI_COPY_TITLE__", () =>
              escapeHtml(uiCopy.document.title),
            )
            .replace("__UI_COPY_DESCRIPTION__", () =>
              escapeHtml(uiCopy.document.description),
            );
        },
      },
      {
        name: "build-manifest",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "version.json",
            source: JSON.stringify(buildInfo, null, 2),
          });
        },
      },
    ],
    build: {
      rolldownOptions: {
        // Only the /questions-next/ build ships the editor's separate HTML entry.
        // Production retains its single-entry module graph and startup path.
        input:
          mode === "preview"
            ? {
                app: fileURLToPath(new URL("./index.html", import.meta.url)),
                editorPreview: fileURLToPath(
                  new URL("./preview/index.html", import.meta.url),
                ),
              }
            : fileURLToPath(new URL("./index.html", import.meta.url)),
        output: {
          codeSplitting: {
            groups: [
              {
                name: "icons",
                test: /@phosphor-icons/,
                priority: 20,
              },
              {
                name: "vendor",
                test: /node_modules\/(?!.*(?:react-easy-crop|normalize-wheel))/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      allowedHosts: ["local.sitkin.top"],
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      exclude: ["e2e/**", "node_modules/**", "dist/**"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        include: ["src/domain/**/*.ts", "src/infrastructure/**/*.ts"],
      },
    },
  };
});
