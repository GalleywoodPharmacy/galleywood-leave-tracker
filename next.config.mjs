/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit reads its built-in font data files (.afm) from inside its own
  // package at runtime. Vercel's serverless file-tracing doesn't pick up
  // non-code files like these automatically, so without this the PDF
  // export route fails at runtime with a 500 even though the build itself
  // succeeds — this explicitly tells it to include them.
  outputFileTracingIncludes: {
    "/api/reports/export/pdf": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;