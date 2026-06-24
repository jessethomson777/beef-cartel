import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Standalone output traced from THIS app dir. Without this, the monorepo-root
  // package-lock.json makes Next infer /workspace as the root and nest the
  // standalone build under .next/standalone/apps/web/.next, which the Firebase
  // App Hosting adapter can't find (it expects .next/standalone/.next/...).
  output: 'standalone',
  outputFileTracingRoot: appDir,

  // The design system is a vendored local package (apps/web/vendor/design-system,
  // linked via a file: dependency) — consumed through node_modules so its
  // component CSS imports work and Next transpiles its TSX.
  transpilePackages: ['@beef-cartel/design-system'],

  // firebase-admin must run unbundled (native/dynamic deps).
  serverExternalPackages: ['firebase-admin'],

  // NOTE: no ESLint config yet — skip lint during build; type-checking stays ON.
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
};

export default nextConfig;
