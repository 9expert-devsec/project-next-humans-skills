/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',           // เมื่อเข้าหน้า Home
        destination: '/th',    // ให้ส่งไปที่ /th
        permanent: true,       // ใช้ 301 Redirect (ดีต่อ SEO)
      },
    ];
  },
};

// ใช้ export default แทน module.exports
export default nextConfig;