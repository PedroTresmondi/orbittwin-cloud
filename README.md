# OrbitTwin Cloud

**Google Maps de segurança climática** — gêmeo digital urbano para planejar rotas mais seguras em São Paulo, combinando geolocalização, roteamento real, clima e zonas de risco de alagamento.

Projeto acadêmico · **Global Solution 2026** (FIAP) · Cloud Solutions & Scalable Infrastructure · Indústria Espacial.

---

## Demonstração

| Ambiente | URL |
|----------|-----|
| **GitHub Pages** | https://pedrotresmondi.github.io/orbittwin-cloud/ |
| Docker local | http://localhost:8080 |
| Desenvolvimento | http://127.0.0.1:5173 |

### Roteiro de apresentação (~60s)

1. Abra o site → clique em **Aleatório e calcular** (origem/destino + rota em um passo).
2. Leia o **resumo da rota segura** (risco convencional vs segura, minutos a mais).
3. Abra **Simular risco na rota** → **Enchente** e mostre o mapa mudando.
4. Expanda **Fontes de dados** → destaque Real (OSRM, Open-Meteo, NASA FIRMS).
5. **Modo Gestor** → painel **Indicadores para tomada de decisão** (KPIs, mapa, alertas, recomendação IA).

Atalho alternativo: **Exemplo com enchente** (Paulista → Santo Amaro pré-configurado).

---

## O que o OrbitTwin faz

Digite origem e destino como em um app de mapas (ex.: **Avenida Paulista** → **Estação Santo Amaro**). O sistema:

1. Geocodifica endereços (**Nominatim** / fallback local SP)
2. Calcula rota convencional e rota segura (**OSRM** + desvio por zonas críticas)
3. Consulta clima real (**Open-Meteo**)
4. Avalia risco, tempo, distância e exposição a alagamentos
5. Explica a recomendação em linguagem clara
6. Salva simulações no histórico (`localStorage`)
7. Gera relatório operacional em modal

---

## Modo Cidadão

- Interface focada em **Planejar rota segura**
- Mensagem direta do tipo: *“Evite a rota convencional… A rota segura leva X minutos a mais, mas evita áreas críticas.”*
- Menos camadas no mapa por padrão (rotas + áreas de risco)
- Histórico em cards
- Relatório da simulação disponível

## Dashboard de tomada de decisão

Seção **Indicadores para tomada de decisão** (Modo Gestor), pensada para a apresentação GS:

| Bloco | Conteúdo |
|-------|----------|
| **KPIs** | Regiões em risco, probabilidade de alagamento, sensores IoT, população impactada, tempo de resposta |
| **Mapa de risco urbano** | Visão sintética de zonas SP + marcadores (sensores, estações, focos) |
| **Regiões críticas** | Ranking em barras horizontais com selo Real/Simulado/Híbrido |
| **Alertas recentes** | Lista contextual (enchente, bloqueio, chuva, rota em risco) |
| **Recomendação OrbitTwin** | Cenário, análise, ação, confiança e fontes |

O painel reage automaticamente às simulações (chuva, enchente, bloqueio, deslizamento, múltiplos) e aos dados reais quando uma rota foi calculada (Open-Meteo, OSRM, NASA FIRMS).

Componentes: `DecisionDashboard`, `KpiCards`, `CriticalRegionsChart`, `UrbanRiskMiniMap`, `RecentAlerts`, `DecisionRecommendation`, `decisionDashboardService.ts`.

## Modo Gestor

- Dashboard de tomada de decisão + KPIs, alertas e mapa regional (legado recolhível)
- Simulação de leitura orbital
- Controles de camadas do mapa (sensores, bloqueios, hospitais/escolas)
- Histórico em tabela com fontes de dados (OSRM, Nominatim, Open-Meteo)
- Relatório completo com ações recomendadas

Toggle global no topo: **Modo Cidadão | Modo Gestor**

---

## Stack

| Tecnologia | Uso |
|------------|-----|
| React + TypeScript + Vite | Frontend SPA |
| Leaflet + OpenStreetMap | Mapa interativo |
| Nominatim | Geocoding (texto → coordenadas) |
| OSRM | Rotas convencional e segura |
| Open-Meteo | Clima no trajeto |
| Playwright | Smoke test E2E |
| Docker (nginx) | Deploy em container |
| GitHub Actions | CI/CD → GitHub Pages |

---

## Início rápido

```bash
git clone https://github.com/PedroTresmondi/orbittwin-cloud.git
cd orbittwin-cloud
npm install
cp .env.example .env.local   # opcional: NASA FIRMS
npm run dev
```

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Type-check + build produção |
| `npm run preview` | Preview em `/orbittwin-cloud/` |
| `npm run smoke` | Teste E2E (app rodando) |

### Smoke test

```bash
npm run dev
# outro terminal:
npm run smoke
```

### Docker

```bash
docker build -t orbittwin-cloud .
docker run -d -p 8080:80 --name orbittwin-cloud orbittwin-cloud
```

---

## Deploy no GitHub Pages

1. Push na branch `main`
2. **Settings → Pages → Source:** **GitHub Actions**
3. (Opcional) **Settings → Secrets and variables → Actions** → crie `VITE_NASA_FIRMS_MAP_KEY` com a chave NASA FIRMS — o build do CI injeta no bundle para produção.
4. Workflow `.github/workflows/deploy.yml`: `npm ci` → smoke → build → deploy

`vite.config.ts` usa `base: "/orbittwin-cloud/"` em produção.

URL publicada: https://pedrotresmondi.github.io/orbittwin-cloud/

---

## Arquitetura

```
src/
├── components/
│   ├── HeroSection.tsx
│   ├── SafeRoutePlanner.tsx
│   ├── AddressSearch.tsx
│   ├── RouteMap.tsx
│   ├── RouteSummary.tsx
│   ├── RouteExplanation.tsx
│   ├── WeatherPanel.tsx
│   ├── LayerControls.tsx
│   ├── OperationalHistory.tsx
│   ├── SimulationReportModal.tsx
│   └── ViewModeToggle.tsx
├── services/
│   ├── geocodingService.ts
│   ├── routeService.ts
│   ├── routeEngine.ts
│   ├── weatherService.ts
│   ├── riskService.ts
│   └── storageService.ts
├── data/riskZones.ts
└── hooks/useSafeRoutePlanner.ts
```

### Fallback local

- **Geocoding:** POIs de SP se Nominatim falhar
- **Roteamento:** trechos OSRM por perna ou rota estimada
- **Clima:** dados simulados com aviso na UI

---

## Fontes de dados

| Fonte | Uso no OrbitTwin | Status no protótipo |
|-------|------------------|---------------------|
| **Open-Meteo** | Clima e previsão (chuva, temp., umidade, vento) | Real quando online |
| **OpenStreetMap + OSRM** | Mapa e rotas convencional/segura | Real quando online |
| **Nominatim** | Geocodificação de endereços | Real / fallback local SP |
| **NASA FIRMS** | Focos de calor e queimadas | Real com chave em `.env.local` (ver abaixo) |
| **CEMADEN** | Pluviômetros e estações | Planejado (estações simuladas SP) |
| **INPE TerraBrasilis** | Camadas espaciais ambientais | Planejado (painel roadmap) |
| **Gêmeo digital** | Polígonos de risco urbano | Simulado para demonstração |

A interface exibe a **Central de Dados OrbitTwin** com selo: Real · Fallback · Simulado · Planejado.

### NASA FIRMS (opcional)

1. Copie `.env.example` para `.env.local` (já ignorado pelo Git).
2. Defina `VITE_NASA_FIRMS_MAP_KEY` com a chave do [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/).
3. Reinicie o dev server (`npm run dev`) para o Vite carregar a variável.

Sem chave, o protótipo usa focos simulados. Com chave, a API é consultada na área da rota; se não houver queimadas ativas na região (comum em SP), o mapa pode ficar sem pontos — isso é dado real, não erro.

**Deploy (GitHub Pages):** variáveis `VITE_*` entram no bundle no build. Para usar FIRMS em produção, configure o secret no workflow de deploy ou aceite que a chave fica visível no JS estático (adequado para demo acadêmica; evite chave de produção sensível).

### Services

```
src/services/
├── weatherService.ts      # Open-Meteo
├── fireService.ts         # NASA FIRMS (+ fallback)
├── rainStationService.ts  # CEMADEN (roadmap)
├── satelliteLayerService.ts
├── environmentalDataService.ts
└── dataHubService.ts
```

## Dados reais e simulação

O OrbitTwin deixa explícito na interface o que é **real** e o que é **simulado para demonstração**.

### Fontes reais (quando online)

| Fonte | Uso |
|-------|-----|
| **OpenStreetMap** | Tiles do mapa (Leaflet) |
| **OSRM** | Geometria de rota convencional e segura |
| **Nominatim** | Geocodificação de endereços |
| **Open-Meteo** | Chuva, probabilidade, temperatura, umidade |

### Painel “Dados reais utilizados”

Cada fonte exibe status: **Online**, **Usando fallback** ou **Simulado**.

### Modo de simulação de eventos

Seção **“Simular cenário de risco”** com botões:

- Chuva forte
- Enchente / alagamento
- Bloqueio de vias
- Deslizamento / encosta
- Múltiplos riscos
- Limpar simulação

Ao ativar um cenário (com rota já calculada), o sistema **recalcula** risco, recomendação, mapa e histórico.

Badge fixo no topo: **Status do cenário** (dados reais ou simulação ativa).

### Botão para apresentação

**“Testar exemplo com enchente simulada”** (no hero):

1. Preenche Avenida Paulista → Estação Santo Amaro  
2. Calcula rotas via OSRM  
3. Ativa enchente simulada  
4. Mostra rota convencional em risco e rota OrbitTwin recomendada  

Ideal para vídeo e banca, mesmo sem chuva real no dia.

### Por que existe simulação?

- Áreas de risco do protótipo são **camadas configuradas** (não oficiais CEMADEN/Prefeitura ainda).
- Em dia seco, a simulação permite **provar** que a rota segura reage a eventos extremos.

---

## Limitações atuais

- Zonas de risco são **representativas** (não oficiais CEMADEN/Prefeitura)
- APIs públicas com rate limit
- Histórico apenas no navegador
- Relatório em modal (sem PDF)

---

## Próximos passos

- [ ] Integração **INMET** e **CEMADEN**
- [ ] Backend com **PostGIS** para zonas oficiais
- [ ] Sensores IoT reais
- [ ] IA treinada com histórico de alagamentos
- [ ] Exportação PDF do relatório

---

## Autor

Global Solution 2026 · FIAP · Indústria Espacial
