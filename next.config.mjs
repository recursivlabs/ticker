/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit ships built-in AFM font files (Helvetica/Times/Courier) and
  // loads them at runtime by string path. Without this, the file-trace
  // pass misses them and PDF generation fails in production with
  // ENOENT for Helvetica.afm.
  experimental: {
    outputFileTracingIncludes: {
      '/api/transcript/pdf': ['./node_modules/pdfkit/js/data/**/*'],
      '/api/release/pdf': ['./node_modules/pdfkit/js/data/**/*'],
      '/api/script/pdf': ['./node_modules/pdfkit/js/data/**/*'],
    },
  },
};

export default nextConfig;
