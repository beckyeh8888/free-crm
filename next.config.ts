import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // Temporarily disabled due to Turbopack issue
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
};

export default nextConfig;
