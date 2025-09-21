const withMDX = require('@next/mdx')({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  output: 'export',  // Enable static exports
  images: {
    unoptimized: true, // Required for static export
  },
};

module.exports = withMDX(nextConfig);