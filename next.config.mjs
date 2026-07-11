/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable font optimization in local dev — GFW blocks Google Fonts.
  // Vercel's build environment has no such restriction.
  optimizeFonts: false,
  experimental: {
    // Ensure lunar-typescript AND calculator/dist/ are included in Vercel deployment.
    // calculator/dist/*.js is called via execSync (child process),
    // so Next.js output file tracing doesn't see these runtime dependencies.
    outputFileTracingIncludes: {
      "/*": [
        "./node_modules/lunar-typescript/**/*",
        "./calculator/**/*",
        "./templates/**/*",
        "./prompts/**/*",
      ],
    },
  },
};

export default nextConfig;
