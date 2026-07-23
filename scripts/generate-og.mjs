// scripts/generate-og.mjs
// Generates the home Open Graph image at exactly 1200x630 from the approved banner.
// Usage: npm run og
//
// Composition strategy — center-weighted crop, NOT letterbox:
// The banner is 8000x2917 (2.74:1); the OG frame is 1200x630 (1.905:1). The banner
// is wider than the frame, so we resize by HEIGHT and crop the sides to fill the
// whole frame instead of leaving solid bars.
//
// The required content, measured on the height-630 resize (1728px wide), spans from
// the left partner logo (x=244) to the rightmost person's shoulder (x=1458) — about
// 1214px, which is slightly WIDER than the 1200 frame. A full-height crop therefore
// clips either a logo or the far-right person. So we use the documented hybrid: resize
// to a height just under 630 (FIT_HEIGHT) so the same content span fits inside 1200
// with margin, crop the sides, and fill the tiny remaining top/bottom bars with a
// blurred, stretched copy of the crop itself — same content, so the bars are
// color- and position-matched and no seam is visible. No flat-color canvas is used.
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SRC = path.join(
  ROOT,
  "public",
  "banner-desktop-the-next-humans-skills-TNHS.png"
);
const OUT_DIR = path.join(ROOT, "public", "og");
const OUT_JPG = path.join(OUT_DIR, "home-og-v2.jpg");
const OUT_PNG = path.join(OUT_DIR, "home-og-v2.png");

const TARGET_W = 1200;
const TARGET_H = 630;
const SIZE_BUDGET = 300 * 1024; // 300 KB

// Height to resize the banner to before cropping the sides. 600 (vs 630) shrinks the
// content span enough that the full 1214px-wide subject fits inside 1200 with ~20px
// margin on each side, leaving a 30px total blurred bar (15px top + 15px bottom).
const FIT_HEIGHT = 600;

// Horizontal content bounds measured empirically on the height-630 resize (1728 wide):
// left partner logo starts ~x244, rightmost person's shoulder ends ~x1458. Used to
// center the crop window on the subject (which sits slightly left of true center).
const CONTENT_LEFT_AT_630 = 244;
const CONTENT_RIGHT_AT_630 = 1458;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source banner not found: ${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Resize by height (preserving aspect) so we can crop the sides.
  const resized = await sharp(SRC)
    .resize({ height: FIT_HEIGHT, withoutEnlargement: false })
    .toBuffer({ resolveWithObject: true });
  const rw = resized.info.width; // ~1646
  const rh = resized.info.height; // == FIT_HEIGHT

  // 2. Center the 1200-wide crop window on the subject's content span.
  const scale = FIT_HEIGHT / TARGET_H;
  const contentLeft = CONTENT_LEFT_AT_630 * scale;
  const contentRight = CONTENT_RIGHT_AT_630 * scale;
  const contentCenter = (contentLeft + contentRight) / 2;
  const offset = clamp(
    Math.round(contentCenter - TARGET_W / 2),
    0,
    rw - TARGET_W
  );
  const leftMargin = Math.round(contentLeft - offset);
  const rightMargin = Math.round(offset + TARGET_W - contentRight);

  // 3. Crop the sides → 1200 x FIT_HEIGHT.
  const crop = await sharp(resized.data)
    .extract({ left: offset, top: 0, width: TARGET_W, height: rh })
    .toBuffer();

  // 4. Fill the frame. If FIT_HEIGHT already equals the target, the crop is final;
  //    otherwise composite it onto a blurred, vertically-stretched copy of itself so
  //    the small top/bottom bars blend seamlessly (no flat color, no seam).
  const barTotal = TARGET_H - rh;
  let canvas;
  if (barTotal <= 0) {
    canvas = sharp(crop);
  } else {
    const bg = await sharp(crop)
      .resize({ width: TARGET_W, height: TARGET_H, fit: "fill" })
      .blur(22)
      .toBuffer();
    const top = Math.round(barTotal / 2);
    canvas = sharp(bg).composite([{ input: crop, top, left: 0 }]);
  }

  // 5. Encode as JPEG (flattened, no alpha). 4:4:4 chroma keeps the white headline
  //    crisp against the dark background. Tune quality down only if over budget.
  let jpegBuf;
  let quality = 85;
  for (; quality >= 60; quality -= 5) {
    jpegBuf = await canvas
      .clone()
      .flatten({ background: "#0B1220" })
      .jpeg({ quality, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toBuffer();
    if (jpegBuf.length <= SIZE_BUDGET) break;
  }
  fs.writeFileSync(OUT_JPG, jpegBuf);

  const jpegOverBudget = jpegBuf.length > SIZE_BUDGET;
  let pngWritten = false;
  if (jpegOverBudget) {
    // PNG fallback only if JPEG still exceeds the budget after tuning.
    const pngBuf = await canvas
      .clone()
      .flatten({ background: "#0B1220" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(OUT_PNG, pngBuf);
    pngWritten = true;
  }

  // 6. Verify output metadata.
  const meta = await sharp(OUT_JPG).metadata();
  const kb = (jpegBuf.length / 1024).toFixed(1);

  console.log("---- OG image generated ----");
  console.log(`Source banner  : ${SRC}`);
  console.log(`Strategy       : center-weighted crop (fit height ${FIT_HEIGHT}, blurred bars ${barTotal}px total)`);
  console.log(`Resized source : ${rw}x${rh}`);
  console.log(`Crop offset    : left=${offset} (content margins L=${leftMargin}px R=${rightMargin}px)`);
  console.log(`Output (JPEG)  : ${OUT_JPG}`);
  console.log(`Dimensions     : ${meta.width}x${meta.height}`);
  console.log(`Format         : ${meta.format}`);
  console.log(`Chroma         : 4:4:4`);
  console.log(`JPEG quality   : ${quality}`);
  console.log(`File size      : ${kb} KB (budget 300 KB)`);
  console.log(`Alpha removed  : ${meta.hasAlpha ? "NO (alpha present!)" : "YES"}`);
  console.log(`Under budget   : ${jpegOverBudget ? "NO" : "YES"}`);
  console.log(`PNG fallback   : ${pngWritten ? `${OUT_PNG} (JPEG exceeded budget)` : "not needed"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
