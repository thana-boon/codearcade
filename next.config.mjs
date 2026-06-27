/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output ทำให้ Docker production image เล็กลง (รัน server.js ได้เลย)
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
