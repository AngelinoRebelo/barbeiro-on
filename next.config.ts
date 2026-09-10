import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "qrcode", "@prisma/client"],
};

export default nextConfig;
