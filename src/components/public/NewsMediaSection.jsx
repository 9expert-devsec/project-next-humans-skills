import NewsMediaSliderClient from "@/components/public/NewsMediaSliderClient";

export default function NewsMediaSection({ locale, t, isEN }) {
  return (
    <section className="section">
      <h2 className="sectionTitle">{t.newsTitle}</h2>
      <div className="sectionDesc">{t.newsDesc}</div>

      <div className="panel">
        <div className="newsGrid">
          <div className="newsMain">
            <NewsMediaSliderClient locale={locale} />
          </div>

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
