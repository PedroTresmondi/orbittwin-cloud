import { chromium } from "playwright";
import path from "node:path";
import { tmpdir } from "node:os";

const url = process.env.APP_URL ?? "http://127.0.0.1:5173/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });
const consoleMessages = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleMessages.push({ type: message.type(), text: message.text() });
  }
});

await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => window.localStorage.removeItem("orbittwin:operational-history:v1"));
await page.reload({ waitUntil: "networkidle" });

const initial = await page.evaluate(() => ({
  title: document.querySelector("h1")?.textContent,
  routeTitle: document.querySelector(".routes h2")?.textContent,
  hasLeafletMap: Boolean(document.querySelector(".routes-map.leaflet-container")),
  tileCount: document.querySelectorAll(".routes-map .leaflet-tile").length,
  routeControls: document.querySelectorAll(".route-field select").length,
  sourceBadge: document.querySelector(".source-badge")?.textContent,
  confidence: document.querySelector(".route-status span:last-child")?.textContent,
  selected: document.querySelector('.zone[aria-pressed="true"]')?.textContent?.replace(/\s+/g, " ").trim(),
  origin: document.querySelector(".route-map__meta span")?.textContent,
  safeRisk: document.querySelector(".route-card--safe strong")?.textContent,
  sectionCount: document.querySelectorAll("section").length,
}));

await page.locator('[data-risk="critical"]').first().click();
await page.waitForTimeout(100);

const afterRegion = await page.evaluate(() => ({
  selected: document.querySelector('.zone[aria-pressed="true"]')?.textContent?.replace(/\s+/g, " ").trim(),
  origin: document.querySelector(".route-map__meta span")?.textContent,
  destination: document.querySelectorAll(".route-map__meta span")[1]?.textContent,
  dangerRisk: document.querySelector(".route-card--danger strong")?.textContent,
  safeRisk: document.querySelector(".route-card--safe strong")?.textContent,
  routeVectors: document.querySelectorAll(".routes-map .leaflet-overlay-pane path").length,
}));

await page.locator(".route-field select").nth(2).selectOption("public_transport");

const beforeRoute = await page.evaluate(() => ({
  safeRisk: document.querySelector(".route-card--safe strong")?.textContent,
  safeTime: document.querySelector(".route-card--safe dd")?.textContent,
  confidence: document.querySelector(".route-status span:last-child")?.textContent,
}));
await page.getByRole("button", { name: "Gerar rota segura" }).click();
await page.waitForFunction(() => document.querySelectorAll(".route-history__list li").length > 0, null, { timeout: 8000 });

const afterButton = await page.evaluate(() => ({
  safeRisk: document.querySelector(".route-card--safe strong")?.textContent,
  safeTime: document.querySelector(".route-card--safe dd")?.textContent,
  sourceBadge: document.querySelector(".source-badge")?.textContent,
  confidence: document.querySelector(".route-status span:last-child")?.textContent,
  historyItems: document.querySelectorAll(".route-history__list li").length,
  decision: document.querySelector(".route-decision")?.textContent?.replace(/\s+/g, " ").trim(),
  avoidedBlocks: Array.from(document.querySelectorAll(".route-card--safe li")).map((item) => item.textContent),
}));

const screenshotPath = path.join(tmpdir(), "orbittwin-react-routes-smoke.png");
await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

const result = {
  url,
  initial,
  afterRegion,
  beforeRoute,
  afterButton,
  consoleMessages,
  screenshotPath,
};

const checks = [
  initial.title === "OrbitTwin Cloud",
  initial.routeTitle === "Rotas Alternativas Seguras",
  initial.hasLeafletMap,
  initial.tileCount > 0,
  initial.routeControls === 3,
  /confiança/.test(initial.confidence ?? ""),
  afterRegion.origin !== initial.origin,
  afterRegion.routeVectors >= 3,
  afterButton.safeRisk !== undefined,
  afterButton.historyItems >= 1,
  afterButton.safeTime !== beforeRoute.safeTime ||
    afterButton.safeRisk !== beforeRoute.safeRisk ||
    afterButton.confidence !== beforeRoute.confidence,
  consoleMessages.length === 0,
];

console.log(JSON.stringify(result, null, 2));

if (checks.some((passed) => !passed)) {
  process.exitCode = 1;
}
