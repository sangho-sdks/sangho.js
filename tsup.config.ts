import { defineConfig } from "tsup";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as {
  version: string;
};

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm", "cjs"],

  dts: true,

  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,

  minify: false,

  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },

  external: [],

  esbuildOptions(options) {
    options.legalComments = "inline";
    options.banner = {
      js: `/* sangho-sdk-js v${pkg.version} — https://docs.sangho.ga/sdks/js */`,
    };
  },
});