/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable font optimization in local dev — GFW blocks Google Fonts.
  // Vercel's build environment has no such restriction.
  optimizeFonts: false,
  experimental: {
    // Include calculator, templates, prompts in Vercel deployment.
    // These are runtime dependencies accessed via execSync (child process)
    // or fs.readFileSync, not visible to Next.js static import analyzer.
    outputFileTracingIncludes: {
      "/api/chart": [
        "./calculator/dist/**/*.js",
        "./calculator/node_modules/**/*",
      ],
      "/api/poster-image": [
        "./calculator/dist/**/*.js",
        "./calculator/node_modules/**/*",
        "./templates/**/*.html",
        "./src/lib/glossary.json",
      ],
      "/api/generate-reading": [
        "./prompts/**/*.md",
      ],
    },
  },
};

export default nextConfig;
