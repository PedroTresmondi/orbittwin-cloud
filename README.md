# OrbitTwin Cloud

Dashboard web de gêmeo digital urbano para monitoramento de riscos ambientais, desenvolvido para a **Global Solution 2026** na disciplina **Cloud Solutions & Scalable Infrastructure**.

## Descrição

O **OrbitTwin Cloud** simula uma central operacional urbana que integra **dados espaciais**, **sensores IoT**, **inteligência artificial** e **rotas alternativas seguras** para monitorar riscos ambientais em áreas urbanas, com foco em alagamentos.

O protótipo foi migrado para **React + TypeScript + Vite**, mantendo a identidade visual dark/espacial e tornando a base mais modular, tipada e fácil de evoluir.

## Funcionalidades

- KPIs de risco urbano, sensores, satélites simulados e alertas críticos.
- Mapa urbano interativo com seis regiões monitoradas.
- Painel de análise da região selecionada com telemetria, chuva, sensores e recomendação preventiva.
- Seção **Rotas Alternativas Seguras** com origem, destino, perfil operacional, recomendação e histórico de decisões.
- Motor de rotas com OSRM público quando disponível e fallback local para manter a operação funcional sem rede.
- Modelo de risco por exposição a área crítica, proximidade de bloqueios e perfil de deslocamento.
- Mapa real com Leaflet + OpenStreetMap, rota convencional em vermelho, rota segura em ciano, área de risco e bloqueios.
- Simulação de nova leitura orbital com variação de riscos, sensores, dados espaciais, alertas e rotas.
- Geração independente de rota segura para a região ativa, com fonte do cálculo e confiança da recomendação.
- Dados espaciais simulados com mini gráficos CSS.
- Fluxo visual de infraestrutura cloud containerizada.

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, TypeScript, Vite |
| Mapa | Leaflet + OpenStreetMap |
| Rotas | OSRM Route Service + fallback local |
| Estilo | CSS customizado |
| Build | Vite |
| Servidor web | Nginx Alpine |
| Containerização | Docker multi-stage |
| Cloud alvo | Azure Container Registry + Azure Container Instances |

## Estrutura

```text
orbittwin-cloud/
├── src/
│   ├── App.tsx          # Composição dos componentes do dashboard
│   ├── data.ts          # Dados iniciais e constantes tipadas
│   ├── simulation.ts    # Helpers puros de simulação e cálculo
│   ├── services/
│   │   ├── riskModel.ts   # Exposição, distância, tempo e confiança da rota
│   │   ├── routeEngine.ts # OSRM + fallback local
│   │   └── storage.ts     # Histórico operacional em localStorage
│   ├── types.ts         # Tipos do domínio OrbitTwin
│   └── main.tsx         # Entrada React
├── index.html           # Entrada Vite
├── style.css            # Identidade visual e layout responsivo
├── package.json         # Scripts e dependências
├── tsconfig.json        # Configuração TypeScript
├── vite.config.ts       # Configuração Vite
├── Dockerfile           # Build React + Nginx
└── README.md
```

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse: [http://127.0.0.1:5173](http://127.0.0.1:5173)

## Build de produção

```bash
npm run build
```

Os arquivos finais são gerados em `dist/`.

## Smoke test visual

Com o servidor local rodando, execute:

```bash
APP_URL=http://127.0.0.1:5173/ npm run smoke
```

No PowerShell:

```powershell
$env:APP_URL='http://127.0.0.1:5173/'; npm run smoke
```

O teste abre a aplicação com Playwright, valida o mapa Leaflet, clica em uma região crítica, altera o perfil operacional, gera uma rota segura, confirma o histórico e salva uma captura em uma pasta temporária.

## Rodar com Docker

```bash
docker build -t orbittwin-cloud:v2 .
docker run -d -p 8080:80 --name orbittwin-cloud orbittwin-cloud:v2
```

Acesse: [http://localhost:8080](http://localhost:8080)

## Publicação na Azure

Fluxo resumido:

1. Gerar imagem Docker local.
2. Enviar a imagem para o Azure Container Registry.
3. Criar uma instância no Azure Container Instances expondo a porta 80.
4. O Nginx entrega o build estático gerado pelo Vite.

## Autor

Projeto acadêmico - Global Solution 2026 · FIAP
