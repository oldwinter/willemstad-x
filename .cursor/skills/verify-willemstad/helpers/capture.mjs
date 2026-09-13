#!/usr/bin/env node
/**
 * Drive one preview feature in headless Chrome.
 * Writes screenshots + computed-style JSON under VERIFY_EVIDENCE_DIR.
 */
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const chrome = process.env.VERIFY_CHROME;
const baseUrl = process.env.VERIFY_BASE_URL;
const outDir = process.env.VERIFY_EVIDENCE_DIR;
const feature = process.env.VERIFY_FEATURE;
const extraQuery = process.env.VERIFY_EXTRA_QUERY || "";

if (!chrome || !baseUrl || !outDir || !feature) {
  console.error("capture.mjs: VERIFY_CHROME, VERIFY_BASE_URL, VERIFY_EVIDENCE_DIR, VERIFY_FEATURE required");
  process.exit(2);
}

const FEATURES = {
  reading: {
    path: "/preview/reading.html",
    variants: [
      { name: "dark", query: "mode=dark" },
      { name: "light", query: "mode=light" },
    ],
    assert(reports) {
      const dark = reports.dark;
      const light = reports.light;
      need(dark.titleAfter.includes("Willemstad v"), "titlebar ::after must print Willemstad version", dark.titleAfter);
      need(light.titleAfter.includes("Willemstad v"), "light titlebar ::after must print Willemstad version", light.titleAfter);
      need(notTransparent(dark.h1Bg), "dark H1 must have a theme background", dark.h1Bg);
      need(notTransparent(light.h1Bg), "light H1 must have a theme background", light.h1Bg);
      need(dark.bodyBg !== light.bodyBg, "light and dark body backgrounds must differ", {
        dark: dark.bodyBg,
        light: light.bodyBg,
      });
      need(dark.bodyClasses.includes("theme-dark"), "dark variant body class", dark.bodyClasses);
      need(light.bodyClasses.includes("theme-light"), "light variant body class", light.bodyClasses);
    },
  },
  callouts: {
    path: "/preview/callouts.html",
    variants: [{ name: "default", query: "mode=dark" }],
    assert(reports) {
      const r = reports.default;
      need(r.noteCallout, "note callout missing");
      need(notTransparent(r.noteBorderLeft) || r.noteBorderLeft.includes("px"), "note callout border-left", r.noteBorderLeft);
      need(r.columnsDisplay === "flex", "columns callout-content must be display:flex", r.columnsDisplay);
      need(r.columnChildCount >= 2, "columns must contain at least two nested callouts", r.columnChildCount);
      need(r.infoboxFloat === "right", "infobox must float right by default", r.infoboxFloat);
      need(r.gridDisplay === "grid" || r.gridDisplay === "flex", "image grid layout", r.gridDisplay);
    },
  },
  cssclasses: {
    path: "/preview/cssclasses.html",
    variants: [{ name: "default", query: "mode=dark" }],
    assert(reports) {
      const r = reports.default;
      need(r.latexFontSize === "14pt" || r.latexFontSize === "18.6667px" || Number.parseFloat(r.latexFontSize) >= 14, "latex reading font-size", r.latexFontSize);
      need(r.latexAlign === "justify", "latex paragraphs are justified", r.latexAlign);
      need(r.cornellTextAlign === "justify", "cornell note body is justified", r.cornellTextAlign);
      need(r.cornellAsideFloat === "left", "cornell aside callout floats left", r.cornellAsideFloat);
    },
  },
  checkboxes: {
    path: "/preview/checkboxes.html",
    variants: [
      { name: "off", query: "mode=dark" },
      { name: "on", query: "mode=dark&opt=ssopt-acrs-enable" },
    ],
    assert(reports) {
      const on = reports.on;
      need(on.bodyClasses.includes("ssopt-acrs-enable"), "ACRS class missing on enabled variant", on.bodyClasses);
      need(Boolean(on.questionMask) && on.questionMask !== "none", "question checkbox must get --icon-mask-image", on.questionMask);
      need(reports.off.questionMask !== on.questionMask, "enabling ACRS must change the question-task mask", {
        off: reports.off.questionMask,
        on: on.questionMask,
      });
    },
  },
  "focused-mode": {
    path: "/preview/focused-mode.html",
    variants: [
      { name: "normal", query: "mode=dark" },
      { name: "focused", query: "mode=dark&opt=ssopt-focused-mode" },
    ],
    assert(reports) {
      const n = reports.normal;
      const f = reports.focused;
      need(n.sidedockDisplay !== "none", "sidedock visible before focused mode", n.sidedockDisplay);
      need(n.titlebarDisplay !== "none", "titlebar visible before focused mode", n.titlebarDisplay);
      need(f.sidedockDisplay === "none", "focused mode hides .mod-sidedock", f.sidedockDisplay);
      need(f.titlebarDisplay === "none", "focused mode hides .titlebar", f.titlebarDisplay);
      need(f.statusDisplay === "none", "focused mode hides .status-bar", f.statusDisplay);
      need(f.ribbonDisplay === "none", "focused mode hides .side-dock-ribbon", f.ribbonDisplay);
    },
  },
};

function need(cond, message, extra) {
  if (!cond) {
    const err = new Error(message);
    err.extra = extra;
    throw err;
  }
}

function notTransparent(bg) {
  if (!bg) return false;
  const t = bg.replace(/\s+/g, "").toLowerCase();
  return t !== "transparent" && t !== "rgba(0,0,0,0)" && t !== "rgba(0,0,0,0.0)";
}

function runChrome(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      chrome,
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--window-size=1440,900",
        "--virtual-time-budget=20000",
        "--timeout=45000",
        ...args,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (d) => stdout.push(d));
    child.stderr.on("data", (d) => stderr.push(d));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

function extractReport(html) {
  const match = html.match(/<script type="application\/json" id="verify-report">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("verify-report JSON missing from dump-dom — CSS may not have applied, or boot.js failed");
  }
  return JSON.parse(match[1]);
}

function withQuery(path, query) {
  const q = [query, extraQuery].filter(Boolean).join("&");
  return q ? `${baseUrl}${path}?${q}` : `${baseUrl}${path}`;
}

const spec = FEATURES[feature];
if (!spec) {
  console.error(`unknown feature ${feature}`);
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });
const reports = {};
const urls = {};

for (const variant of spec.variants) {
  const url = withQuery(spec.path, variant.query);
  urls[variant.name] = url;
  const shot = join(outDir, `${variant.name}.png`);
  const shotResult = await runChrome([`--screenshot=${shot}`, url]);
  if (shotResult.code !== 0) {
    writeFileSync(join(outDir, `${variant.name}.chrome.stderr.txt`), shotResult.stderr);
    throw new Error(`chrome screenshot failed for ${url} (exit ${shotResult.code})`);
  }
  const dump = await runChrome(["--dump-dom", url]);
  writeFileSync(join(outDir, `${variant.name}.dom.html`), dump.stdout);
  if (dump.code !== 0) {
    writeFileSync(join(outDir, `${variant.name}.chrome.stderr.txt`), dump.stderr);
    throw new Error(`chrome dump-dom failed for ${url} (exit ${dump.code})`);
  }
  reports[variant.name] = extractReport(dump.stdout);
  writeFileSync(join(outDir, `${variant.name}.report.json`), JSON.stringify(reports[variant.name], null, 2));
}

try {
  spec.assert(reports);
} catch (err) {
  const failure = {
    ok: false,
    feature,
    error: err.message,
    extra: err.extra ?? null,
    reports,
    urls,
  };
  writeFileSync(join(outDir, "summary.json"), JSON.stringify(failure, null, 2));
  console.error(`ASSERT FAIL: ${err.message}`);
  if (err.extra) console.error(JSON.stringify(err.extra, null, 2));
  process.exit(1);
}

const summary = { ok: true, feature, urls, reports };
writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ok: true, feature, evidence: outDir, urls }, null, 2));
