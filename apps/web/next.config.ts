import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The design system is a vendored local package (apps/web/vendor/design-system,
  // linked via a file: dependency). It's consumed through node_modules, so its
  // component CSS imports work and Next transpiles its TSX.
  transpilePackages: ['@beef-cartel/design-system'],

  // firebase-admin must run unbundled (native/dynamic deps).
  serverExternalPackages: ['firebase-admin'],

  // NOTE: no ESLint config is set up yet — skip lint during build so it doesn't
  // block. Type-checking stays ON. Add an eslint config + remove this later.
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
