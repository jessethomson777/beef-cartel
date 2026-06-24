import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Consume the design system from source (raw .tsx/.css) — Next transpiles it.
  // This is what makes apps/web render with the real brand components.
  transpilePackages: ['@beef-cartel/design-system'],

  // Monorepo: trace files from the workspace root so the App Hosting / standalone
  // build bundles the workspace-linked design-system correctly.
  // NOTE: if the App Hosting build ever fails resolving the workspace package,
  // the fallback is to vendor the design system into apps/web/src/ds (copy
  // packages/design-system/src) and switch imports to '@/ds' — see README.
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // firebase-admin must run unbundled (native/dynamic deps).
  serverExternalPackages: ['firebase-admin'],

  // NOTE: no ESLint config is set up yet — skip lint during build so it doesn't
  // block. Type-checking stays ON. Add an eslint config + remove this later.
  eslint: { ignoreDuringBuilds: true },

  images: {
    // Allow remote product imagery (swap/extend for your real CDN host).
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
};

export default nextConfig;
