/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable font optimization in local dev — GFW blocks Google Fonts.
  // Vercel's build environment has no such restriction.
  optimizeFonts: false,
  experimental: {
    // Ensure lunar-typescript is included in Vercel deployment.
    // calculator/dist/*.js calls it via execSync (child process),
    // so Next.js output file tracing doesn't see the dependency.
    outputFileTracingIncludes: {
      "/*": ["./node_modules/lunar-typescript/**/*"],
    },
  },
};

export default nextConfig;
