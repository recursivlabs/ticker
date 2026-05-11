/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdfkit out of the webpack bundle. pdfkit loads its built-in
  // AFM font files at runtime by string path resolved against its own
  // __dirname — bundling breaks that path. As an external package it
  // resolves from node_modules where the data dir lives next to it.
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

export default nextConfig;
