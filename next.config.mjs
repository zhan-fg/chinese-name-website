/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable font optimization in local dev — GFW blocks Google Fonts.
  // Vercel's build environment has no such restriction.
  optimizeFonts: false,
};

export default nextConfig;
