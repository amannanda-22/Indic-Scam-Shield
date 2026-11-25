/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  agentRules: false,
  // If ML_SERVICE_URL is set (npm run dev:all sets it; also usable for a self-hosted deploy) the Python path is proxied to the
  // real scikit-learn FastAPI service. On Vercel it is NOT set, so api/py/predict.py (Python function) serves this path.
  async rewrites() {
    const u = process.env.ML_SERVICE_URL;
    return u ? [{ source: "/api/py/predict", destination: `${u.replace(/\/$/, "")}/predict` }] : [];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
