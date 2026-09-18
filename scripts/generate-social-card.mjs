import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const width = 1200;
const height = 630;
const background = { r: 245, g: 245, b: 245, alpha: 1 };

const projectRoot = resolve(__dirname, "..");
const publicDir = resolve(projectRoot, "public");

const logoPath = resolve(publicDir, "unes.png");
const outputPath = resolve(publicDir, "social-card.png");

async function main() {
  const logoBuffer = await readFile(logoPath);

  const logo = await sharp(logoBuffer)
    .resize({ width: 220, height: 220, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const headline = "Absensi Universitas Ekasakti";
  const subline = "Rekap Kehadiran Pegawai & Mahasiswa";
  const sanitizedHeadline = headline.replace(/&/g, "&amp;");
  const sanitizedSubline = subline.replace(/&/g, "&amp;");
  const url = "absensiunes.vercel.app";

  const textSvg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="rgb(245,245,245)" rx="32" ry="32" />
    <rect x="48" y="48" width="1104" height="534" fill="white" rx="28" ry="28" stroke="rgb(32,32,32)" stroke-width="3" />
  <text x="408" y="250" font-family="'Times New Roman', Times, serif" font-size="48" font-weight="700" fill="rgb(32,32,32)">${sanitizedHeadline}</text>
  <text x="408" y="310" font-family="'Times New Roman', Times, serif" font-size="30" fill="rgb(70,70,70)">${sanitizedSubline}</text>
    <text x="408" y="380" font-family="'Times New Roman', Times, serif" font-size="28" fill="rgb(32,32,32)">${url}</text>
  </svg>`;

  const textOverlay = Buffer.from(textSvg);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  })
    .composite([
      { input: textOverlay, top: 0, left: 0 },
      { input: logo, top: 205, left: 140 },
    ])
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`Generated social card at ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
