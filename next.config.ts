import type { NextConfig } from "next";

/* ============================================================================
   ARCHMAGE — dual-mode Next.js config.
   ----------------------------------------------------------------------------
   Sandbox/dev  : default          → output "standalone" (self-hosted server)
   GitHub Pages : BUILD_MODE=pages → output "export"     (static site in ./out)

   The Pages build additionally takes BASE_PATH (e.g. /archmage when deployed
   to https://user.github.io/archmage). See README.md → "Deploy to GitHub
   Pages" and .github/workflows/deploy.yml, which wires both env vars.
   ============================================================================ */

const isPages = process.env.BUILD_MODE === "pages";
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: isPages ? "export" : "standalone",
  trailingSlash: isPages,
  basePath,
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
