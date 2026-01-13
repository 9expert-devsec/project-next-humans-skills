import NewsMediaSliderClient from "@/components/public/NewsMediaSliderClient";

export default function NewsMediaSection({ locale = "th" }) {
  const isEN = locale === "en";

  const t = {
    title: isEN ? "News / Media" : "ข่าวสาร / สื่อ",
    desc: isEN
      ? "Latest updates and highlights from our ecosystem"
      : "อัปเดตข่าวสาร กิจกรรม และสื่อจากระบบกลาง",
  };

  return (
    <section className="section">
      <h2 className="sectionTitle">{t.title}</h2>
      <div className="sectionDesc">{t.desc}</div>

      <div className="panel">
        <div className="newsGrid">
          {/* Main Slider */}
          <div className="newsMain">
            <NewsMediaSliderClient locale={locale} />
          </div>

          {/* Side Info */}
          <div className="newsSide">
            <div className="newsCard">
              <b>{isEN ? "Upload & Sort" : "อัปโหลดและจัดลำดับ"}</b>
              <span>{isEN ? "Manage from Admin" : "จัดการได้จากหลังบ้าน"}</span>
            </div>

            <div className="newsCard">
              <b>{isEN ? "Auto Slide" : "สไลด์อัตโนมัติ"}</b>
              <span>
                {isEN
                  ? "Loop & pause on hover"
                  : "วนลูป และหยุดเมื่อเอาเมาส์วาง"}
              </span>
            </div>

            <div className="newsCard">
              <b>{isEN ? "Click to view" : "กดดูภาพใหญ่"}</b>
              <span>
                {isEN ? "Show title & caption" : "แสดงชื่อภาพและคำอธิบาย"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
