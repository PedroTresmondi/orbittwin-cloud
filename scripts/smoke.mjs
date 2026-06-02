import { chromium } from "playwright";
import path from "node:path";
import { tmpdir } from "node:os";

const url = process.env.APP_URL ?? "http://127.0.0.1:5173/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const consoleMessages = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleMessages.push({ type: message.type(), text: message.text() });
  }
});

await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => {
  window.localStorage.removeItem("orbittwin:operational-history:v2");
  window.localStorage.removeItem("orbittwin:operational-history:v1");
});
await page.reload({ waitUntil: "networkidle" });

const initial = await page.evaluate(() => ({
  title: document.querySelector("h1")?.textContent,
  planner: document.querySelector(".planner h2")?.textContent,
  hasOriginInput: Boolean(document.querySelector("#origin")),
}));

await page.getByRole("button", { name: "Usar exemplo" }).click();
await page.waitForTimeout(300);

await page.getByRole("button", { name: "Calcular rota segura" }).click();
await page.waitForSelector(".route-summary__message", { timeout: 15000 });

const afterRoute = await page.evaluate(() => ({
  summary: document.querySelector(".route-summary__message")?.textContent,
  hasMap: Boolean(document.querySelector(".routes-map.leaflet-container")),
  weather: Boolean(document.querySelector(".weather-panel")),
  explanation: Boolean(document.querySelector(".route-explanation")),
  historyCards: document.querySelectorAll(".history-card").length,
}));

await page.getByRole("tab", { name: "Modo Gestor" }).click();
await page.waitForTimeout(300);

const manager = await page.evaluate(() => ({
  kpis: document.querySelectorAll(".kpi").length,
  urbanMap: Boolean(document.querySelector(".urban-map")),
}));

await page.getByRole("button", { name: "Gerar relatório da simulação" }).click();
await page.waitForTimeout(300);

const modal = await page.evaluate(() => ({
  open: Boolean(document.querySelector(".modal")),
  title: document.querySelector("#report-title")?.textContent,
}));

await page.getByLabel("Fechar relatório").click();

const screenshotPath = path.join(tmpdir(), "orbittwin-maps-smoke.png");
await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

const result = { url, initial, afterRoute, manager, modal, consoleMessages, screenshotPath };

const checks = [
  initial.title === "OrbitTwin Cloud",
  initial.planner === "Planejar rota segura",
  initial.hasOriginInput,
  (afterRoute.summary?.length ?? 0) > 20,
  afterRoute.hasMap,
  afterRoute.weather,
  afterRoute.explanation,
  afterRoute.historyCards >= 1,
  manager.kpis >= 5,
  modal.open && modal.title === "Relatório da simulação",
  consoleMessages.length === 0,
];

console.log(JSON.stringify(result, null, 2));

if (checks.some((passed) => !passed)) {
  process.exitCode = 1;
}
