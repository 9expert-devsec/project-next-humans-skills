import Link from "next/link";
import LocaleSwitch from "@/components/LocaleSwitch";

export default function Header({ locale = "th" }) {
  const isEN = locale === "en";
  const t = {
    home: isEN ? "Home" : "หน้าแรก",
    admin: isEN ? "Admin" : "แอดมิน",
  };

  return (
    <div className="topbar">
      <div className="container">
        <div className="nav">
          <Link href={`/${locale}`} className="brand">
            <span className="brandDot" />
            <span>NEXT SKILLS</span>
          </Link>

          <div className="navLinks">
            <Link className="navLink" href={`/${locale}`}>
              {t.home}
            </Link>
            <Link className="navLink" href={`/${locale}/k8Pz7M2xYn5R0wLq/admin/login`}>
              {t.admin}
            </Link>
          </div>

          <div className="langPill" aria-label="Language switch">
            <LocaleSwitch />
          </div>
        </div>
      </div>
      <hr className="hr" />
    </div>
  );
}
