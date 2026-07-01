import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],
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
