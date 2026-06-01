/**
 * OrbitTwin Cloud — Dashboard interativo
 * Simula leituras orbitais, sensores IoT e alertas de IA
 */

(function () {
  "use strict";

  var RISK_LEVELS = ["low", "medium", "high", "critical"];
  var RISK_LABELS = { low: "Baixo", medium: "Médio", high: "Alto", critical: "Crítico" };
  var RISK_SCORE = { low: 25, medium: 50, high: 75, critical: 95 };
  var SATELLITES = ["GOES-16", "Sentinel-2", "Landsat-9", "COSMO-SkyMed", "SAOCOM-1A"];

  /** Estado global simulado da aplicação */
  var state = {
    lastReading: new Date(),
    selectedRegion: "centro",
    kpis: {
      cityRisk: { label: "Alto", score: 72 },
      regions: { active: 6, total: 6 },
      sensors: { active: 128, total: 132 },
      satellites: { count: 4, names: "GOES-16 · Sentinel-2" },
      criticalAlerts: 2,
    },
    regions: {
      centro: {
        name: "Centro Expandido",
        risk: "high",
        rain: "38 mm",
        sensors: "24 / 25",
        source: "Sentinel-2 · NDWI urbano",
        recommendation:
          "Ativar equipes de drenagem nas vias principais. Reforçar monitoramento de bueiros e alertar comércios em áreas baixas.",
      },
      leste: {
        name: "Zona Leste",
        risk: "critical",
        rain: "52 mm",
        sensors: "18 / 20",
        source: "GOES-16 · precipitação IR",
        recommendation:
          "Evacuação preventiva em bairros ribeirinhos. Acionar sirenes IoT e bloquear vias de acesso à margem do rio.",
      },
      oeste: {
        name: "Zona Oeste",
        risk: "medium",
        rain: "22 mm",
        sensors: "31 / 32",
        source: "Landsat-9 · umidade de superfície",
        recommendation:
          "Manter observação ativa. Preparar barreiras de contenção em pontos de alagamento recorrente.",
      },
      sul: {
        name: "Zona Sul",
        risk: "low",
        rain: "12 mm",
        sensors: "28 / 28",
        source: "SAOCOM-1A · radar SAR",
        recommendation:
          "Condições estáveis. Manter rotina de inspeção. Próxima passagem orbital em 12 minutos.",
      },
      tiete: {
        name: "Marginal Tietê",
        risk: "critical",
        rain: "48 mm",
        sensors: "15 / 18",
        source: "COSMO-SkyMed · nível hídrico",
        recommendation:
          "Nível do rio acima do limiar operacional. Fechar ciclovia marginal e acionar bombas de recalque nos trechos 3 e 7.",
      },
      encosta: {
        name: "Área de Encosta",
        risk: "high",
        rain: "41 mm",
        sensors: "12 / 15",
        source: "Sentinel-2 · inclinação + NDWI",
        recommendation:
          "Risco de deslizamento em encostas saturadas. Interditar trilhas e acionar monitoramento geotécnico contínuo.",
      },
    },
    spatial: {
      ndwi: { value: 0.42, unit: "índice", bars: [30, 55, 42, 68, 45, 50, 42] },
      precipitation: { value: 45, unit: "mm", bars: [20, 35, 28, 45, 38, 42, 45] },
      surfaceTemp: { value: 28.4, unit: "°C", bars: [60, 55, 58, 62, 65, 63, 58] },
      humidity: { value: 82, unit: "%", bars: [70, 75, 78, 80, 82, 79, 82] },
      cloudCover: { value: 67, unit: "%", bars: [40, 50, 55, 60, 67, 65, 67] },
    },
    alerts: [
      {
        type: "critical",
        time: "14:32",
        region: "Marginal Tietê",
        recommendation: "Acionar protocolo de contenção hídrica. Nível do rio 1,2 m acima do limiar.",
      },
      {
        type: "critical",
        time: "14:28",
        region: "Zona Leste",
        recommendation: "Evacuação preventiva recomendada. IA indica 87% de probabilidade de alagamento severo.",
      },
      {
        type: "warning",
        time: "14:15",
        region: "Centro Expandido",
        recommendation: "Mobilizar equipes de drenagem. Acúmulo hídrico detectado em 3 pontos críticos.",
      },
      {
        type: "warning",
        time: "13:58",
        region: "Área de Encosta",
        recommendation: "Umidade do solo acima de 90%. Interditar trilhas e monitorar inclinômetros.",
      },
      {
        type: "info",
        time: "13:41",
        region: "Global",
        recommendation: "Nova leitura orbital processada. Resolução espacial de 10 m aplicada ao gêmeo digital.",
      },
    ],
  };

  /** Referências DOM */
  var els = {};

  function cacheElements() {
    els.lastReading = document.getElementById("last-reading");
    els.btnSimulate = document.getElementById("btn-simulate");
    els.kpiRisk = document.getElementById("kpi-risk");
    els.kpiRiskBar = document.getElementById("kpi-risk-bar");
    els.kpiRiskMeta = document.getElementById("kpi-risk-meta");
    els.kpiRegions = document.getElementById("kpi-regions");
    els.kpiRegionsBar = document.getElementById("kpi-regions-bar");
    els.kpiSensors = document.getElementById("kpi-sensors");
    els.kpiSensorsBar = document.getElementById("kpi-sensors-bar");
    els.kpiSensorsMeta = document.getElementById("kpi-sensors-meta");
    els.kpiSatellites = document.getElementById("kpi-satellites");
    els.kpiSatellitesBar = document.getElementById("kpi-satellites-bar");
    els.kpiSatellitesMeta = document.getElementById("kpi-satellites-meta");
    els.kpiAlerts = document.getElementById("kpi-alerts");
    els.kpiAlertsBar = document.getElementById("kpi-alerts-bar");
    els.analysisContent = document.getElementById("analysis-content");
    els.analysisSubtitle = document.getElementById("analysis-subtitle");
    els.spatialData = document.getElementById("spatial-data");
    els.alertsGrid = document.getElementById("alerts-grid");
    els.alertsCount = document.getElementById("alerts-count");
    els.zones = document.querySelectorAll(".zone");
  }

  /** Utilitários */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomItem(arr) {
    return arr[randomInt(0, arr.length - 1)];
  }

  function riskClass(level) {
    return "risk--" + level;
  }

  function formatTime(date) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function formatDateTime(date) {
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function randomBars(count, max) {
    var bars = [];
    for (var i = 0; i < count; i++) {
      bars.push(randomInt(15, max));
    }
    return bars;
  }

  /** Calcula risco médio da cidade com base nas regiões */
  function computeCityRisk() {
    var keys = Object.keys(state.regions);
    var sum = 0;
    keys.forEach(function (key) {
      sum += RISK_SCORE[state.regions[key].risk];
    });
    var avg = Math.round(sum / keys.length);
    var label = "Baixo";
    if (avg >= 80) label = "Crítico";
    else if (avg >= 60) label = "Alto";
    else if (avg >= 40) label = "Médio";
    state.kpis.cityRisk = { label: label, score: avg };
  }

  function countCriticalAlerts() {
    state.kpis.criticalAlerts = state.alerts.filter(function (a) {
      return a.type === "critical";
    }).length;
  }

  /** Renderização dos KPIs */
  function renderKpis() {
    var k = state.kpis;

    els.kpiRisk.textContent = k.cityRisk.label;
    els.kpiRiskBar.style.width = k.cityRisk.score + "%";
    els.kpiRiskMeta.textContent = "Índice " + k.cityRisk.score + "/100";

    els.kpiRegions.textContent = k.regions.active + " / " + k.regions.total;
    els.kpiRegionsBar.style.width = (k.regions.active / k.regions.total) * 100 + "%";

    els.kpiSensors.textContent = k.sensors.active + " / " + k.sensors.total;
    var sensorPct = Math.round((k.sensors.active / k.sensors.total) * 100);
    els.kpiSensorsBar.style.width = sensorPct + "%";
    els.kpiSensorsMeta.textContent = sensorPct + "% operacionais";

    els.kpiSatellites.textContent = String(k.satellites.count);
    els.kpiSatellitesBar.style.width = (k.satellites.count / 5) * 100 + "%";
    els.kpiSatellitesMeta.textContent = k.satellites.names;

    els.kpiAlerts.textContent = String(k.criticalAlerts);
    els.kpiAlertsBar.style.width = Math.min(k.criticalAlerts * 25, 100) + "%";

    els.lastReading.textContent = formatDateTime(state.lastReading) + " UTC-3";
  }

  /** Renderização do mapa urbano */
  function renderMap() {
    Object.keys(state.regions).forEach(function (key) {
      var region = state.regions[key];
      var badge = document.querySelector('[data-badge="' + key + '"]');
      var bar = document.querySelector('[data-bar="' + key + '"]');
      var zone = document.querySelector('[data-region="' + key + '"]');

      if (badge) {
        badge.textContent = RISK_LABELS[region.risk];
        badge.className = "zone__badge " + riskClass(region.risk);
      }
      if (bar) {
        bar.style.transform = "scaleX(" + RISK_SCORE[region.risk] / 100 + ")";
      }
      if (zone) {
        zone.setAttribute("data-risk", region.risk);
      }
    });
  }

  /** Renderização do painel de análise */
  function renderAnalysis() {
    var region = state.regions[state.selectedRegion];
    if (!region) return;

    els.analysisSubtitle.textContent = region.name + " · telemetria em tempo real";

    var riskPct = RISK_SCORE[region.risk];
    var sensorParts = region.sensors.split(" / ");
    var sensorPct = Math.round((parseInt(sensorParts[0], 10) / parseInt(sensorParts[1], 10)) * 100);

    els.analysisContent.innerHTML =
      '<div class="analysis-block">' +
      '<span class="analysis-block__label">Região</span>' +
      '<span class="analysis-block__value">' + region.name + "</span>" +
      "</div>" +
      '<div class="analysis-block">' +
      '<span class="analysis-block__label">Nível de risco</span>' +
      '<span class="analysis-block__value analysis-block__value--risk ' + riskClass(region.risk) + '">' +
      RISK_LABELS[region.risk] +
      "</span>" +
      "</div>" +
      '<div class="analysis-metric">' +
      '<div class="analysis-metric__head"><span>Índice de risco</span><span>' + riskPct + "%</span></div>" +
      '<div class="bar-chart"><span class="bar-chart__fill" style="width:' + riskPct +
      "%;background:linear-gradient(90deg,var(--orange),var(--red))\"></span></div>" +
      "</div>" +
      '<div class="analysis-metric">' +
      '<div class="analysis-metric__head"><span>Chuva prevista (6h)</span><span>' + region.rain + "</span></div>" +
      '<div class="bar-chart"><span class="bar-chart__fill" style="width:' + randomInt(40, 90) +
      "%;background:linear-gradient(90deg,var(--blue),var(--cyan))\"></span></div>" +
      "</div>" +
      '<div class="analysis-metric">' +
      '<div class="analysis-metric__head"><span>Sensores ativos</span><span>' + region.sensors + "</span></div>" +
      '<div class="bar-chart"><span class="bar-chart__fill" style="width:' + sensorPct +
      "%;background:linear-gradient(90deg,#16a34a,var(--green))\"></span></div>" +
      "</div>" +
      '<div class="analysis-block">' +
      '<span class="analysis-block__label">Fonte espacial simulada</span>' +
      '<span class="analysis-block__value">' + region.source + "</span>" +
      "</div>" +
      '<div class="analysis-block">' +
      '<span class="analysis-block__label">Recomendação preventiva</span>' +
      '<p class="analysis-rec">' + region.recommendation + "</p>" +
      "</div>";
  }

  /** Renderização dos dados espaciais */
  function renderSpatial() {
    var labels = {
      ndwi: "NDWI urbano",
      precipitation: "Precipitação acumulada",
      surfaceTemp: "Temperatura de superfície",
      humidity: "Umidade estimada",
      cloudCover: "Cobertura de nuvens",
    };

    var html = "";
    Object.keys(state.spatial).forEach(function (key) {
      var item = state.spatial[key];
      var barsHtml = item.bars
        .map(function (h) {
          return "<span style=\"height:" + h + "%\"></span>";
        })
        .join("");

      html +=
        '<div class="spatial-item">' +
        '<div class="spatial-item__label">' + labels[key] + "</div>" +
        '<div class="spatial-item__value">' + item.value +
        ' <span class="spatial-item__unit">' + item.unit + "</span></div>" +
        '<div class="spatial-bars">' + barsHtml + "</div>" +
        "</div>";
    });

    els.spatialData.innerHTML = html;
  }

  /** Renderização dos alertas */
  function renderAlerts() {
    var typeLabels = { critical: "Crítico", warning: "Atenção", info: "Informativo" };

    els.alertsGrid.innerHTML = state.alerts
      .map(function (alert) {
        return (
          '<article class="alert-card alert-card--' + alert.type + '">' +
          '<div class="alert-card__top">' +
          '<span class="alert-card__time">' + alert.time + "</span>" +
          '<span class="alert-card__type alert-card__type--' + alert.type + '">' +
          typeLabels[alert.type] +
          "</span>" +
          "</div>" +
          '<p class="alert-card__region">' + alert.region + "</p>" +
          '<p class="alert-card__rec">' + alert.recommendation + "</p>" +
          "</article>"
        );
      })
      .join("");

    els.alertsCount.textContent = state.alerts.length + " ativos";
  }

  /** Marca região selecionada no mapa */
  function setActiveRegion(key) {
    state.selectedRegion = key;
    els.zones.forEach(function (zone) {
      zone.setAttribute("aria-pressed", zone.dataset.region === key ? "true" : "false");
    });
    renderAnalysis();
  }

  /** Simula nova leitura orbital — atualiza todos os dados */
  function simulateOrbitalReading() {
    els.btnSimulate.classList.add("is-loading");
    document.querySelectorAll(".kpi, .spatial-item").forEach(function (el) {
      el.classList.add("is-updating");
    });

    state.lastReading = new Date();

    // Atualiza risco de cada região aleatoriamente
    Object.keys(state.regions).forEach(function (key) {
      var region = state.regions[key];
      region.risk = randomItem(RISK_LEVELS);
      region.rain = randomInt(8, 58) + " mm";
      var total = randomInt(12, 32);
      var active = randomInt(Math.max(8, total - 5), total);
      region.sensors = active + " / " + total;
      region.source = randomItem(SATELLITES) + " · " + randomItem(["NDWI", "precipitação IR", "radar SAR", "nível hídrico"]);
    });

    // Atualiza KPIs
    state.kpis.sensors.active = randomInt(115, 132);
    state.kpis.sensors.total = 132;
    state.kpis.satellites.count = randomInt(3, 5);
    state.kpis.satellites.names = randomItem(SATELLITES) + " · " + randomItem(SATELLITES);

    // Atualiza dados espaciais
    state.spatial.ndwi.value = (Math.random() * 0.6 + 0.1).toFixed(2);
    state.spatial.ndwi.bars = randomBars(7, 80);
    state.spatial.precipitation.value = randomInt(15, 65);
    state.spatial.precipitation.bars = randomBars(7, 90);
    state.spatial.surfaceTemp.value = (Math.random() * 8 + 24).toFixed(1);
    state.spatial.surfaceTemp.bars = randomBars(7, 85);
    state.spatial.humidity.value = randomInt(55, 95);
    state.spatial.humidity.bars = randomBars(7, 95);
    state.spatial.cloudCover.value = randomInt(30, 90);
    state.spatial.cloudCover.bars = randomBars(7, 90);

    // Gera novos alertas
    var regionNames = Object.keys(state.regions).map(function (k) {
      return state.regions[k].name;
    });
    var now = new Date();
    state.alerts = [
      {
        type: "critical",
        time: formatTime(new Date(now.getTime() - randomInt(1, 5) * 60000)),
        region: randomItem(regionNames),
        recommendation: "Nova leitura orbital detectou anomalia hídrica. Acionar protocolo de resposta imediata.",
      },
      {
        type: randomItem(["critical", "warning"]),
        time: formatTime(new Date(now.getTime() - randomInt(6, 15) * 60000)),
        region: randomItem(regionNames),
        recommendation: "Correlação IA: precipitação + saturação do solo acima do limiar operacional.",
      },
      {
        type: "warning",
        time: formatTime(new Date(now.getTime() - randomInt(16, 30) * 60000)),
        region: randomItem(regionNames),
        recommendation: "Reforçar monitoramento IoT. Tendência de elevação nos sensores pluviométricos.",
      },
      {
        type: "info",
        time: formatTime(now),
        region: "Global",
        recommendation: "Passagem orbital concluída. Gêmeo digital atualizado com resolução de 10 m.",
      },
    ];

    computeCityRisk();
    countCriticalAlerts();

    setTimeout(function () {
      renderKpis();
      renderMap();
      renderAnalysis();
      renderSpatial();
      renderAlerts();
      els.btnSimulate.classList.remove("is-loading");
      document.querySelectorAll(".kpi, .spatial-item").forEach(function (el) {
        el.classList.remove("is-updating");
      });
    }, 600);
  }

  /** Eventos */
  function bindEvents() {
    els.zones.forEach(function (zone) {
      zone.addEventListener("click", function () {
        setActiveRegion(zone.dataset.region);
      });
    });

    els.btnSimulate.addEventListener("click", simulateOrbitalReading);
  }

  /** Inicialização */
  function init() {
    cacheElements();
    computeCityRisk();
    countCriticalAlerts();
    renderKpis();
    renderMap();
    renderSpatial();
    renderAlerts();
    bindEvents();
    setActiveRegion("centro");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
