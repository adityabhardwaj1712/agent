const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["reactflow", "lucide-react", "three", "@react-three/fiber", "@react-three/drei"],
  swcMinify: false,
};

module.exports = nextConfig;

