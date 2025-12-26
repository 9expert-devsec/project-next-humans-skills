export default function HeroMockup() {
  return (
    <div className="mockWrap" aria-hidden="true">
      <div className="mockGlow" />

      {/* Main mock screen */}
      <div className="mockScreen">
        <div className="mockTopbar">
          <div className="mockDots">
            <span />
            <span />
            <span />
          </div>
          <div className="mockTitle">NEXT SKILLS</div>
          <div className="mockPill">Live</div>
        </div>

        <div className="mockBody">
          <div className="mockLeft">
            <div className="mockKpi">
              <div className="mockKpiLabel">Registrations</div>
              <div className="mockKpiValue">128</div>
              <div className="mockKpiSub">+12% this week</div>
            </div>

            <div className="mockList">
              <div className="mockRow">
                <span className="mockAvatar" />
                <div className="mockText">
                  <b>Power BI</b>
                  <span>Bangkok • Jan</span>
                </div>
                <span className="mockStatus ok">Active</span>
              </div>
              <div className="mockRow">
                <span className="mockAvatar" />
                <div className="mockText">
                  <b>Automation</b>
                  <span>Online • Feb</span>
                </div>
                <span className="mockStatus warn">Pending</span>
              </div>
              <div className="mockRow">
                <span className="mockAvatar" />
                <div className="mockText">
                  <b>Blockchain</b>
                  <span>Bangkok • Mar</span>
                </div>
                <span className="mockStatus">Draft</span>
              </div>
            </div>
          </div>

          <div className="mockRight">
            <div className="mockChart">
              <div className="mockChartHeader">
                <b>Monthly Trend</b>
                <span>last 6 months</span>
              </div>
              <div className="mockBars">
                <span style={{ height: "38%" }} />
                <span style={{ height: "52%" }} />
                <span style={{ height: "66%" }} />
                <span style={{ height: "48%" }} />
                <span style={{ height: "74%" }} />
                <span style={{ height: "86%" }} />
              </div>
              <div className="mockAxis">
                <span />
              </div>
            </div>

            <div className="mockCardSmall">
              <b>AI • Automation</b>
              <span>Fast registration flow</span>
              <div className="mockProgress">
                <i />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating card */}
      <div className="mockFloat">
        <div className="mockFloatIcon" />
        <div className="mockFloatText">
          <b>Export CSV</b>
          <span>Admin-ready</span>
        </div>
      </div>
    </div>
  );
}
