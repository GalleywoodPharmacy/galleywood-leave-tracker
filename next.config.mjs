/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit's build uses a Node "imports" self-reference (e.g.
  // #standard-fonts/Helvetica) to load its built-in fonts. Next.js's
  // bundler doesn't resolve that correctly when it tries to fold pdfkit
  // into the serverless function, causing a runtime "Cannot find module"
  // error even though the build itself succeeds. Marking it external tells
  // Next.js to leave it alone and let Node's own module resolution — which
  // handles this fine — run it directly instead.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;