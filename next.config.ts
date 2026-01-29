
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Turbopack root: explicitly set to this project's directory to avoid warnings when multiple
  // lockfiles exist in the workspace (outer repo + inner project). Using './' makes the root
  // the directory that contains this config file.
  turbopack: {
    root: './',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This is required to allow the Next.js dev server to accept requests from the
  // Firebase Studio environment.
  allowedDevOrigins: [
    'https://6000-firebase-studio-1760282428980.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev',
  ],
};

export default nextConfig;
