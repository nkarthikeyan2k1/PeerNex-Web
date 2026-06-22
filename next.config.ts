import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...(process.env.NEXT_PUBLIC_SOCKET_BACKEND_URL ? [process.env.NEXT_PUBLIC_SOCKET_BACKEND_URL] : []),
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],
  async rewrites() {
    const backend = process.env.SOCKET_BACKEND_URL || 'http://localhost:3001';
    return [
      // bare /socket.io (no trailing slash) — first polling handshake
      {
        source: '/socket.io',
        destination: `${backend}/socket.io`,
      },
      // /socket.io/ and /socket.io/anything — subsequent requests
      {
        source: '/socket.io/:path*',
        destination: `${backend}/socket.io/:path*`,
      },
    ];
  },
  sassOptions: {
    // Add the folder that actually contains your variables & mixins
    includePaths: [path.join(__dirname, "styles")],
    // Pre‑pend the variables (and mixins, if you have them) to every SCSS file
    additionalData: `
      @use "@/styles/variables" as *;
      @use "@/styles/mixins" as *;
    `,
  },
};

export default nextConfig;
