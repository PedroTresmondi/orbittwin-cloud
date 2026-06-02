# OrbitTwin Cloud

**Google Maps de segurança climática** — gêmeo digital urbano para calcular rotas seguras com dados reais de geocoding, roteamento, clima e risco de alagamento.

Desenvolvido para a **Global Solution 2026** (FIAP) — Cloud Solutions & Scalable Infrastructure.

## Experiência principal

Digite em linguagem comum:

- **Origem:** Avenida Paulista  
- **Destino:** Estação Santo Amaro  

O OrbitTwin:

1. Busca coordenadas reais (**Nominatim / OpenStreetMap**)
2. Calcula rota convencional e rota segura (**OSRM** + desvio por zonas de risco)
3. Consulta clima real (**Open-Meteo**)
4. Avalia risco do trajeto e explica a recomendação
5. Salva histórico no navegador
6. Permite gerar relatório da simulação

## Modos de uso

| Modo | Público | Interface |
|------|---------|-----------|
| **Cidadão** | População geral | Simples: origem, destino, calcular, mensagem clara |
| **Gestor** | Defesa Civil / operação | + KPIs, mapa regional, alertas, dados espaciais, relatório |

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra a URL do Vite (ex.: `http://127.0.0.1:5173`).

### Build e preview

```bash
npm run build
npm run preview
```

O build de produção usa `base: "/NOME_DO_REPOSITORIO/"` (GitHub Pages). O `npm run dev` continua na raiz (`/`) para desenvolvimento local.

Para testar localmente o mesmo caminho da publicação:

```bash
npm run build
npm run preview
```

Abra: `http://127.0.0.1:4173/NOME_DO_REPOSITORIO/`

### Smoke test

```bash
npm run dev
# Em outro terminal:
npm run smoke
# Se a porta for diferente:
# $env:APP_URL="http://127.0.0.1:5176/"; npm run smoke
```

### Docker

```bash
docker build -t orbittwin-cloud:v2 .
docker run -d -p 8080:80 --name orbittwin-cloud orbittwin-cloud:v2
```

Acesse: **http://localhost:8080**

## Deploy no GitHub Pages

Publicação automática via **GitHub Actions** ao fazer push na branch `main`.

### URL final

```
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/
```

Substitua `SEU_USUARIO` pelo seu usuário GitHub e `NOME_DO_REPOSITORIO` pelo nome exato do repositório (case-sensitive).

### Configurar no GitHub

1. Faça push do código para o repositório `SEU_USUARIO/NOME_DO_REPOSITORIO`.
2. Em **Settings → Pages**:
   - **Build and deployment → Source:** selecione **GitHub Actions**.
3. O workflow `.github/workflows/deploy.yml` irá:
   - instalar dependências (`npm ci`);
   - rodar `npm run smoke` (com servidor de desenvolvimento temporário);
   - rodar `npm run build`;
   - publicar a pasta `dist` com `actions/upload-pages-artifact@v3` e `actions/deploy-pages@v4`.
4. Após o workflow concluir, o site ficará disponível na URL acima.

### Alterar o `base` do Vite

Edite `vite.config.ts` e ajuste a constante para o nome real do repositório:

```ts
const GITHUB_PAGES_BASE = "/NOME_DO_REPOSITORIO/";
```

Exemplo: repositório `orbittwin-cloud` → `"/orbittwin-cloud/"`.

Também atualize esta documentação e o link esperado no README.

Regras:

| Comando | `base` usado |
|---------|----------------|
| `npm run dev` | `/` (desenvolvimento local simples) |
| `npm run build` | `/NOME_DO_REPOSITORIO/` (artefato para GitHub Pages) |

### Build local (mesmo artefato do CI)

```bash
npm ci
npm run build
```

Os arquivos estáticos ficam em `dist/`. O `Dockerfile` e os scripts existentes (`dev`, `preview`, `smoke`, Docker) permanecem inalterados.

### Verificar deploy

- Aba **Actions** do repositório → workflow **Deploy GitHub Pages**
- Aba **Settings → Pages** → confira a URL publicada

## APIs e serviços

| Serviço | Arquivo | Função |
|---------|---------|--------|
| **Nominatim** | `geocodingService.ts` | Texto → coordenadas (debounce + fallback local SP) |
| **OSRM** | `routeEngine.ts` | Rotas convencional e segura (waypoints de desvio) |
| **Open-Meteo** | `weatherService.ts` | Chuva, probabilidade, temperatura, umidade |
| **Risco** | `riskService.ts` | `compareRouteRisks()` — score, exposição, explicação |
| **Zonas** | `data/riskZones.ts` | Polígonos de alagamento/deslizamento em SP |
| **Histórico** | `storageService.ts` | `localStorage` v2 com recarga e limpeza |

## Arquitetura frontend

```
src/
├── components/
│   ├── SafeRoutePlanner.tsx    # Tela principal “Planejar rota segura”
│   ├── AddressSearch.tsx       # Autocomplete com debounce
│   ├── RouteSummary.tsx
│   ├── RouteExplanation.tsx
│   ├── WeatherPanel.tsx
│   ├── RouteMap.tsx            # Leaflet + camadas
│   └── ...
├── services/
│   ├── geocodingService.ts
│   ├── routeService.ts         # planSafeRoute()
│   ├── routeEngine.ts          # getRoute / getSafeRoute
│   ├── weatherService.ts
│   ├── riskService.ts
│   └── storageService.ts
├── data/riskZones.ts
└── App.tsx
```

## Fluxo do usuário

1. Digite origem e destino (ou **Usar exemplo**)
2. Selecione perfil (Cidadão, Pedestre, Motorista, etc.)
3. **Calcular rota segura**
4. Veja mapa (vermelho = convencional, ciano = OrbitTwin)
5. Leia resumo, clima e “Por que o OrbitTwin recomenda?”
6. Histórico salvo automaticamente
7. (Gestor) **Gerar relatório da simulação**

## Limitações

- Zonas de risco são **simuladas** (polígonos representativos de SP)
- Nominatim público tem rate limit (~1 req/s) — há fallback local
- OSRM público pode falhar — motor local de contingência ativa
- Histórico apenas no navegador (`localStorage`)
- Sem PDF no relatório (apenas modal)

## Próximos passos

- Backend para histórico centralizado (Azure Cosmos DB / PostgreSQL)
- Dados oficiais de alagamento (Prefeitura / CEMADEN)
- Autocomplete com Mapbox/Google Places (opcional)
- Notificações push em eventos críticos
- Exportação PDF do relatório

## Autor

Projeto acadêmico — Global Solution 2026 · FIAP · Indústria Espacial
