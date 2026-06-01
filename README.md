# OrbitTwin Cloud

Dashboard web de gêmeo digital urbano para monitoramento de riscos ambientais, desenvolvido para a **Global Solution 2026** — disciplina **Cloud Solutions & Scalable Infrastructure**.

## Descrição

O **OrbitTwin Cloud** simula um painel operacional profissional que integra **dados espaciais**, **sensores IoT** e **inteligência artificial** para monitorar riscos ambientais em áreas urbanas, com foco em **alagamentos**. O dashboard apresenta indicadores em tempo real (simulados), mapa interativo com seis regiões, análise detalhada por zona, alertas inteligentes, produtos espaciais derivados e visualização da infraestrutura cloud de entrega.

## Relação com a Indústria Espacial

A solução está conectada ao tema **Indústria Espacial** ao utilizar:

- **Imagens e telemetria de satélites** (GOES-16, Sentinel-2, Landsat-9, COSMO-SkyMed, SAOCOM-1A) para mapeamento de áreas de risco
- **Órbitas LEO** e geoestacionária para redundância de sensores terrestres
- **Produtos geoespaciais simulados** (NDWI urbano, precipitação acumulada, temperatura de superfície)
- **Gêmeo digital urbano** alimentado por modelos preditivos de IA
- Infraestrutura **cloud escalável** na Microsoft Azure via containers Docker

## Funcionalidades do Dashboard

### Header institucional
- Nome **OrbitTwin Cloud** com animação orbital
- Subtítulo explicativo sobre gêmeo digital, dados espaciais, IoT e IA
- Badge **Global Solution 2026 | Indústria Espacial**
- Status **Publicado em Azure Container Instances**

### Indicadores principais (KPIs)
- Risco médio da cidade (com barra de progresso)
- Regiões monitoradas
- Sensores ativos (rede IoT)
- Satélites simulados
- Alertas críticos

### Mapa urbano interativo
Seis regiões clicáveis com níveis de risco (Baixo, Médio, Alto, Crítico):
- Centro Expandido
- Zona Leste
- Zona Oeste
- Zona Sul
- Marginal Tietê
- Área de Encosta

### Painel "Análise da Região"
Ao clicar em uma região, exibe:
- Nome e nível de risco
- Gráficos de barras CSS (índice de risco, chuva, sensores)
- Chuva prevista
- Sensores ativos
- Fonte espacial simulada
- Recomendação preventiva

### Dados espaciais simulados
- NDWI urbano
- Precipitação acumulada
- Temperatura de superfície
- Umidade estimada
- Cobertura de nuvens

Cada métrica inclui mini-gráficos de barras construídos apenas com HTML/CSS.

### Alertas Inteligentes
Cards com horário, tipo de alerta, região afetada e recomendação preventiva.

### Infraestrutura Cloud
Fluxo visual: **Docker → Azure Container Registry → Azure Container Instances → Nginx (porta 80) → DNS público**.

### Simulação orbital
Botão **"Simular nova leitura orbital"** atualiza dinamicamente:
- Todos os KPIs e barras de progresso
- Níveis de risco das regiões no mapa
- Dados espaciais e mini-gráficos
- Alertas inteligentes
- Timestamp da última leitura

## Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Servidor web | Nginx (Alpine) |
| Containerização | Docker |
| Cloud (deploy) | Azure Container Registry (ACR) + Azure Container Instances (ACI) |

> Sem frameworks, sem React, sem Vue e sem dependências externas.

## Como rodar localmente (sem Docker)

1. Clone ou baixe este repositório
2. Abra o arquivo `index.html` diretamente no navegador

Ou, usando um servidor HTTP simples:

```bash
# Python 3
python -m http.server 8080
```

Acesse: [http://localhost:8080](http://localhost:8080)

## Como rodar com Docker

Na pasta raiz do projeto (`orbittwin-cloud/`):

```bash
# Build da imagem
docker build -t orbittwin-cloud:v1 .

# Executar o container
docker run -d -p 8080:80 --name orbittwin-cloud orbittwin-cloud:v1
```

### Como acessar

Abra no navegador: **[http://localhost:8080](http://localhost:8080)**

### Comandos úteis

```bash
# Ver containers em execução
docker ps

# Parar o container
docker stop orbittwin-cloud

# Remover o container
docker rm orbittwin-cloud

# Ver logs
docker logs orbittwin-cloud

# Rebuild após alterações
docker build -t orbittwin-cloud:v1 .
docker rm -f orbittwin-cloud
docker run -d -p 8080:80 --name orbittwin-cloud orbittwin-cloud:v1
```

## Publicação na Azure (ACR + ACI)

Fluxo resumido para deploy em produção:

1. **Build local** da imagem Docker (`orbittwin-cloud:v1`)
2. **Azure Container Registry (ACR)** — criar registry e fazer push da imagem:
   ```bash
   az acr login --name <seu-registry>
   docker tag orbittwin-cloud:v1 <seu-registry>.azurecr.io/orbittwin-cloud:v1
   docker push <seu-registry>.azurecr.io/orbittwin-cloud:v1
   ```
3. **Azure Container Instances (ACI)** — criar instância a partir da imagem no ACR:
   ```bash
   az container create \
     --resource-group <seu-rg> \
     --name orbittwin-cloud \
     --image <seu-registry>.azurecr.io/orbittwin-cloud:v1 \
     --ports 80 \
     --dns-name-label orbittwin-cloud \
     --registry-login-server <seu-registry>.azurecr.io
   ```
4. O usuário acessa o dashboard pelo **IP público ou FQDN** da instância ACI; o container **Nginx** entrega os arquivos estáticos na **porta 80**.

## Estrutura do Projeto

```
orbittwin-cloud/
├── index.html      # Estrutura do dashboard
├── style.css       # Tema dark/espacial profissional
├── script.js       # Interatividade e simulação orbital
├── Dockerfile      # Imagem Nginx Alpine
└── README.md       # Documentação
```

## Autor

Projeto acadêmico — Global Solution 2026 · FIAP
