/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.licdn.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/auth-svc/:path*',    destination: `${process.env.AUTH_SERVICE_URL    || 'http://localhost:8080'}/api/:path*` },
      { source: '/api/profile-svc/:path*', destination: `${process.env.PROFILE_SERVICE_URL || 'http://localhost:8081'}/api/:path*` },
      { source: '/api/company-svc/:path*', destination: `${process.env.COMPANY_SERVICE_URL || 'http://localhost:8082'}/api/:path*` },
      { source: '/api/jobs-svc/:path*',    destination: `${process.env.JOBS_SERVICE_URL    || 'http://localhost:8083'}/api/:path*` },
    ];
  },
};
module.exports = nextConfig;
