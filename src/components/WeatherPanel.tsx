import type { WeatherForecast } from "../types";

type WeatherPanelProps = {
  weather: WeatherForecast | null;
  scenarioActive?: boolean;
};

function formatFetchedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function WeatherPanel({ weather, scenarioActive = false }: WeatherPanelProps) {
  if (!weather) {
    return (
      <section className="weather-panel card">
        <h3>Condições reais do tempo</h3>
        <p className="weather-panel__empty">Calcule uma rota para carregar previsão do Open-Meteo.</p>
      </section>
    );
  }

  const simulated = weather.isSimulated || scenarioActive;

  return (
    <section className="weather-panel card">
      <header className="weather-panel__head">
        <h3>Condições reais do tempo</h3>
        <span className={`weather-panel__source${simulated ? " weather-panel__source--mock" : ""}`}>
          {simulated ? "Modo simulado" : weather.source}
        </span>
      </header>
      <dl className="weather-panel__grid">
        <div>
          <dt>Chuva prevista (1h)</dt>
          <dd>{weather.precipitationNextHour} mm</dd>
        </div>
        <div>
          <dt>Chuva prevista (2h)</dt>
          <dd>{weather.precipitationNext2Hours} mm</dd>
        </div>
        <div>
          <dt>Probabilidade de chuva</dt>
          <dd>{weather.precipitationProbability}%</dd>
        </div>
        <div>
          <dt>Temperatura</dt>
          <dd>{weather.temperature} °C</dd>
        </div>
        <div>
          <dt>Umidade</dt>
          <dd>{weather.humidity}%</dd>
        </div>
        {weather.windSpeed !== undefined && (
          <div>
            <dt>Vento (10m)</dt>
            <dd>{weather.windSpeed} km/h</dd>
          </div>
        )}
        <div>
          <dt>Fonte</dt>
          <dd>
            {simulated ? "Cenário simulado / fallback" : weather.source}
            {weather.dataStatus === "real" ? " (real)" : " (fallback)"}
          </dd>
        </div>
        <div>
          <dt>Atualizado às</dt>
          <dd>{formatFetchedAt(weather.fetchedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
