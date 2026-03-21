/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Avoid broken webpack vendor chunks for scoped packages (e.g. @vercel/oidc via @ai-sdk/*) after HMR
    serverComponentsExternalPackages: [
      "@elevenlabs/elevenlabs-js",
      "@ai-sdk/openai",
      "@vercel/oidc",
    ],
  },
};

export default nextConfig;
