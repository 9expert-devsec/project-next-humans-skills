export default function HeroIllustration() {
  return (
    <div className="illusWrap" aria-hidden="true">
      <div className="illusGlow" />
      <div className="illusGrid" />

      {/* City skyline */}
      <div className="city">
        <span className="b b1" />
        <span className="b b2" />
        <span className="b b3" />
        <span className="b b4" />
        <span className="b b5" />
        <span className="b b6" />
        <span className="b b7" />
        <span className="b b8" />
        <span className="b b9" />
        <span className="b b10" />
      </div>

      {/* Data flow lines */}
      <div className="flow">
        <span className="line l1" />
        <span className="line l2" />
        <span className="line l3" />
      </div>

      {/* Team silhouettes */}
      <div className="team">
        <div className="p p1">
          <span className="head" />
          <span className="body" />
        </div>
        <div className="p p2">
          <span className="head" />
          <span className="body" />
        </div>
        <div className="p p3">
          <span className="head" />
          <span className="body" />
        </div>

        {/* hologram face */}
        <div className="face">
          <span className="faceRing" />
          <span className="faceScan" />
        </div>
      </div>

      {/* Floating cards */}
      <div className="illusCard c1">
        <div className="ic" />
        <div className="txt">
          <b>Human • Growth</b>
          <span>People-first training</span>
        </div>
      </div>

      <div className="illusCard c2">
        <div className="pill">
          <span className="dotG" /> Blockchain
        </div>
        <div className="pill">
          <span className="dotB" /> AI
        </div>
        <div className="pill">
          <span className="dotY" /> Data
        </div>
      </div>

      {/* Globe hologram */}
      <div className="globe">
        <span className="gRing" />
        <span className="gRing2" />
        <span className="gScan" />
        <span className="gGridLat" />
        <span className="gGridLon" />
        <span className="gDot d1" />
        <span className="gDot d2" />
        <span className="gDot d3" />
        <span className="gDot d4" />
      </div>
    </div>
  );
}
