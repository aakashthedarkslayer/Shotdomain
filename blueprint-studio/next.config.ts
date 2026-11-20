import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  // This app lives inside another repo: pin the root so Next doesn't pick the parent lockfile.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  // mupdf ships a WASM binary and pdf-lib is CJS: keep both out of the bundle.
  serverExternalPackages: ["mupdf", "pdf-lib"],
};

export default nextConfig;
