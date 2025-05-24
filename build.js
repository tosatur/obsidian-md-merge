require("esbuild").build({
    entryPoints: ["main.ts"],
    bundle: true,
    outfile: "main.js",
    format: "cjs",
    target: ["es2020"],
    platform: "node",
    external: ["obsidian"],
  }).catch(() => process.exit(1));
  