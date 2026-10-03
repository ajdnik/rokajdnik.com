// Generates public/Rok_Ajdnik_CV.pdf from src/data/cv.js.
// ATS-safe: standard fonts, real text in linear reading order, single column,
// no tables or images.
import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cv, CV_PDF_PATH } from "../src/data/cv.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REGULAR = "Helvetica";
const BOLD = "Helvetica-Bold";
const ACCENT = "#1d4ed8";
const INK = "#111827";
const MUTED = "#4b5563";
const BODY = 9.5;
const SITE = cv.website;

const plain = (s) => s.replaceAll("→", ">");
const abs = (u) => (u.startsWith("/") ? SITE + u : u);
const bare = (u) => u.replace(/^https?:\/\//, "");

function build(file) {
  const out = resolve(root, "public", file.slice(1));
  mkdirSync(dirname(out), { recursive: true });

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 38, bottom: 34, left: 46, right: 46 },
    info: {
      Title: `${cv.name} - CV`,
      Author: cv.name,
      Subject: `Curriculum Vitae - ${cv.headline}`,
      Keywords: cv.skills.flatMap((s) => s.items).join(", "),
    },
  });
  doc.pipe(createWriteStream(out));

  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const bottom = () => doc.page.height - doc.page.margins.bottom;
  // Keep a block together: break page if it would not fit.
  const need = (h) => {
    if (doc.y + h > bottom()) doc.addPage();
  };

  // ---- Header ----
  const top = doc.y;
  doc.fillColor(INK).font(BOLD).fontSize(26).text(cv.name, left, top, { width });
  doc.fillColor(ACCENT).font(BOLD).fontSize(13).text(cv.headline, { width });
  doc.moveDown(0.4).fillColor(MUTED).font(REGULAR).fontSize(BODY);
  doc.text(cv.location, { width });
  if (cv.pdfEmail) doc.text(cv.pdfEmail, { width, link: `mailto:${cv.pdfEmail}`, underline: false });
  doc.text(bare(cv.linkedin), { width, link: cv.linkedin, underline: false });
  doc.text(bare(cv.website), { width, link: cv.website, underline: false });
  doc.y += 4;
  doc.x = left;

  // ---- Helpers ----
  const heading = (label) => {
    need(60);
    doc.moveDown(0.7);
    doc.fillColor(ACCENT).font(BOLD).fontSize(11.5)
      .text(label.toUpperCase(), left, doc.y, { characterSpacing: 1 });
    const y = doc.y + 2;
    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.8).stroke(ACCENT);
    doc.y = y + 7;
    doc.x = left;
    doc.fillColor(INK);
  };

  const body = (s, opts = {}) =>
    doc.fillColor(INK).font(REGULAR).fontSize(BODY).text(plain(s), left, doc.y, { width, lineGap: 1.5, ...opts });

  const bullet = (s) => {
    const indent = 12;
    doc.font(REGULAR).fontSize(BODY);
    need(doc.heightOfString(plain(s), { width: width - indent, lineGap: 1.5 }) + 2);
    const y = doc.y;
    doc.fillColor(ACCENT).text("•", left + 2, y, { lineBreak: false });
    doc.fillColor(INK).text(plain(s), left + indent, y, { width: width - indent, lineGap: 1.5 });
    doc.x = left;
  };

  // Title, then one text run "Company | dates" so ATS text extraction keeps them together.
  const titleRow = (title, org, dates) => {
    doc.fillColor(INK).font(BOLD).fontSize(11).text(title, left, doc.y, { width });
    doc.fillColor(ACCENT).font(BOLD).fontSize(BODY)
      .text(org ? `${org}` : "", left, doc.y, { continued: true, width })
      .fillColor(MUTED).font(REGULAR)
      .text(`${org ? " | " : ""}${dates}`);
    doc.moveDown(0.15);
  };

  // ---- Summary ----
  heading("Summary");
  body(cv.summary);

  // ---- Experience ----
  heading("Experience");
  cv.experience.forEach((e, i) => {
    if (i) doc.moveDown(0.5);
    need(e.achievements ? 60 : 45);
    titleRow(e.title, e.company, `${e.start} - ${e.end}`);
    if (e.description) body(e.description);
    if (e.achievementsLabel) {
      doc.moveDown(0.3);
      need(30);
      doc.fillColor(INK).font(BOLD).fontSize(BODY).text(e.achievementsLabel, left, doc.y, { width });
    }
    if (e.achievements?.length) {
      doc.moveDown(0.3);
      e.achievements.forEach(bullet);
    }
    if (e.technologies?.length) {
      doc.moveDown(0.3);
      need(16);
      doc.fillColor(INK).font(BOLD).fontSize(BODY).text("Technologies: ", left, doc.y, { continued: true, width, lineGap: 1.5 })
        .font(REGULAR).text(e.technologies.join(", "));
    }
  });

  // ---- Skills ----
  heading("Skills");
  for (const s of cv.skills) {
    doc.font(BOLD).fontSize(BODY);
    const h = doc.heightOfString(`${s.group}: ${s.items.join(", ")}`, { width }) + 4;
    need(h);
    doc.fillColor(INK).font(BOLD).text(`${s.group}: `, left, doc.y, { continued: true, width, lineGap: 1.5 })
      .font(REGULAR).text(s.items.join(", "));
    doc.moveDown(0.25);
  }

  // ---- Patents ----
  heading("Patents");
  cv.patents.forEach((p, i) => {
    if (i) doc.moveDown(0.5);
    doc.font(BOLD).fontSize(BODY);
    need(48);
    doc.fillColor(INK).font(BOLD).fontSize(BODY).text(p.title, left, doc.y, { width, link: p.url, lineGap: 1.5 });
    doc.fillColor(MUTED).font(REGULAR).text(
      `${p.number} | ${p.status} | filed ${p.filed} | ${p.assignee}`, { width });
    doc.text(`Co-inventors: ${p.coInventors.join(", ")}`, { width });
  });

  // ---- Talks ----
  heading("Conference Talks");
  for (const t of cv.talks) {
    need(40);
    doc.fillColor(INK).font(BOLD).fontSize(BODY).text(t.title, left, doc.y, { width, link: abs(t.url), lineGap: 1.5 });
    doc.fillColor(MUTED).font(REGULAR).text(`${t.event} | ${t.date}`, { width });
  }

  // ---- Projects ----
  heading("Projects");
  for (const r of cv.openSource) {
    need(30);
    doc.fillColor(INK).font(BOLD).fontSize(BODY).text(r.name, left, doc.y, { continued: true, link: r.url })
      .font(REGULAR).text(` - ${r.description} (${bare(r.url)})`, { link: r.url, width });
    doc.moveDown(0.2);
  }

  // ---- Education ----
  heading("Education");
  for (const e of cv.education) {
    need(45);
    titleRow(e.degree, e.school, `${e.start} - ${e.end}`);
    doc.fillColor(MUTED).font(REGULAR).text(e.field);
  }

  // ---- Certifications ----
  heading("Certifications");
  cv.certifications.forEach(bullet);

  doc.end();
  console.log(`Wrote ${out}`);
}

build(CV_PDF_PATH);
