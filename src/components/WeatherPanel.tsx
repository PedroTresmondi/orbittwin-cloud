import type { WeatherForecast } from "../types";

type WeatherPanelProps = {
  weather: WeatherForecast | null;
};

export function WeatherPanel({ weather }: WeatherPanelProps) {
  if (!weather) {
    return (
      <section className="weather-panel card">
        <h3>Condições reais do tempo</h3>
        <p className="weather-panel__empty">Calcule uma rota para carregar previsão do Open-Meteo.</p>
      </section>
    );
  }

  return (
    <section className="weather-panel card">
      <header className="weather-panel__head">
        <h3>Condições reais do tempo</h3>
        <span className={`weather-panel__source${weather.isSimulated ? " weather-panel__source--mock" : ""}`}>
          {weather.isSimulated ? "Modo simulado" : weather.source}
        </span>
      </header>
      <dl className="weather-panel__grid">
        <div>
          <dt>Chuva prevista (2h)</dt>
          <dd>{weather.precipitationNext2Hours} mm</dd>
        </div>
        <div>
          <dt>Próxima 1h</dt>
          <dd>{weather.precipitationNextHour} mm</dd>
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
      </dl>
    </section>
  );
}
