// src/app/[locale]/[adminKey]/(auth)/admin/login/layout.jsx
export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLoginLayout({ children }) {
  return <>{children}</>;
}
