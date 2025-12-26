export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footerGrid">
          <div>
            <div className="brand" style={{ gap: 10 }}>
              <span className="brandDot" />
              <span>NEXT SKILLS</span>
            </div>
            <div className="footerSmall">
              ระบบลงทะเบียนอบรม + หลังบ้านจัดการ
            </div>
            <div className="footerSmall">
              © {new Date().getFullYear()} NEXT SKILLS
            </div>
          </div>

          <div className="footerBadges">
            <span className="badge">
              <span
                className="dot"
                style={{ background: "var(--acc-green)" }}
              />
              Bitkub
            </span>
            <span className="badge">
              <span className="dot" style={{ background: "var(--acc-blue)" }} />
              9Expert
            </span>
            <span className="badge">
              <span
                className="dot"
                style={{ background: "var(--acc-yellow)" }}
              />
              Key
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
