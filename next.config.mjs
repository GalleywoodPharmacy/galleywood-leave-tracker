/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfkit's build uses a Node "imports" self-reference (e.g.
    // #standard-fonts/Helvetica) to load its built-in fonts. Next.js's
    // bundler doesn't resolve that correctly when it tries to fold pdfkit
    // into the serverless function, causing a runtime "Cannot find module"
    // error even though the build itself succeeds. Marking it external
    // tells Next.js to leave it alone and let Node's own module
    // resolution — which handles this fine — run it directly instead.
    serverComponentsExternalPackages: ["pdfkit"],
    // Even external, Vercel's automatic file-tracing doesn't follow
    // pdfkit's "imports" map to find the .cjs font files it loads at
    // runtime (e.g. js/standard-fonts/Helvetica.cjs) — without this
    // they're missing from the deployed function entirely, even though
    // the build succeeds. On Next 14.x this setting only takes effect
    // nested inside `experimental`, not at the top level.
    outputFileTracingIncludes: {
      "/api/reports/export/pdf": ["./node_modules/pdfkit/js/**/*"],
    },
  },
};

export default nextConfig;