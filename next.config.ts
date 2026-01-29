import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
};

export default nextConfig;
