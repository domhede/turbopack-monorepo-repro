const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  output: 'standalone',
};

module.exports = nextConfig;
