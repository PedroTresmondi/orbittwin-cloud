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
  heroTitle: document.querySelector("#hero-title")?.textContent,
  dataHub: Boolean(document.querySelector(".data-hub")),
  scenarioSim: Boolean(document.querySelector(".scenario-simulator")),
  scenarioStatus: Boolean(document.querySelector(".scenario-status")),
}));

await page.getByRole("button", { name: "Testar exemplo com enchente simulada" }).click();
await page.waitForSelector(".route-summary__message", { timeout: 60000 });
await page.waitForFunction(
  () => {
    const calc = document.querySelector(".btn-orbit--large");
    const scenarioBtns = document.querySelectorAll(
      ".scenario-simulator__btn:not(.scenario-simulator__btn--clear)",
    );
    return !calc?.classList.contains("is-loading") && [...scenarioBtns].every((b) => !b.disabled);
  },
  { timeout: 60000 },
);

const afterFloodDemo = await page.evaluate(() => ({
  summary: document.querySelector(".route-summary__message")?.textContent,
  hasMap: Boolean(document.querySelector(".routes-map.leaflet-container")),
  weather: Boolean(document.querySelector(".weather-panel")),
  modeTag: document.querySelector(".route-summary__mode")?.textContent,
  statusText: document.querySelector(".scenario-status strong")?.textContent,
}));

await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".scenario-simulator__btn")].find((b) =>
    b.textContent?.trim().startsWith("Chuva forte"),
  );
  btn?.click();
});
await page.waitForFunction(
  () => document.querySelector(".scenario-status strong")?.textContent?.includes("Chuva") ?? false,
  { timeout: 60000 },
);

const afterRain = await page.evaluate(() => ({
  statusText: document.querySelector(".scenario-status strong")?.textContent,
}));

await page.getByRole("button", { name: "Gerar relatório da simulação" }).click();
await page.waitForTimeout(400);

const modal = await page.evaluate(() => ({
  open: Boolean(document.querySelector(".modal")),
  title: document.querySelector("#report-title")?.textContent,
  hasScenario: Boolean(document.body.textContent?.includes("Cenário ativo")),
}));

await page.getByLabel("Fechar relatório").click();

await page.getByRole("tab", { name: "Modo Gestor" }).click();
await page.waitForTimeout(300);

const manager = await page.evaluate(() => ({
  kpis: document.querySelectorAll(".kpi").length,
  managerPanel: Boolean(document.getElementById("manager-panel")),
}));

const screenshotPath = path.join(tmpdir(), "orbittwin-maps-smoke.png");
await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

const result = { url, initial, afterFloodDemo, afterRain, modal, manager, consoleMessages, screenshotPath };

const checks = [
  initial.title === "OrbitTwin Cloud",
  initial.heroTitle === "OrbitTwin",
  initial.dataHub,
  initial.scenarioSim,
  initial.scenarioStatus,
  (afterFloodDemo.summary?.length ?? 0) > 20,
  afterFloodDemo.hasMap,
  afterFloodDemo.weather,
  (afterFloodDemo.statusText?.includes("Enchente") || afterFloodDemo.statusText?.includes("alagamento")) ?? false,
  (afterRain.statusText?.includes("Chuva") ?? false),
  modal.open && modal.title === "Relatório da simulação" && modal.hasScenario,
  manager.kpis >= 5,
  manager.managerPanel,
  consoleMessages.length === 0,
];

console.log(JSON.stringify(result, null, 2));

if (checks.some((passed) => !passed)) {
  process.exitCode = 1;
}
