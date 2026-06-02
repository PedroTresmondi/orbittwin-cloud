import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Base path para GitHub Pages.
 * Produção: https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/
 * Desenvolvimento local (npm run dev): "/" para não exigir subcaminho no Vite.
 */
const GITHUB_PAGES_BASE = "/orbittwin-cloud/";

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  // dev: "/" | build + preview (produção): subcaminho do GitHub Pages
  base: command === "serve" && mode === "development" ? "/" : GITHUB_PAGES_BASE,
}));
