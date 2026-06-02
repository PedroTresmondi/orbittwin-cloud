import L from "leaflet";

/** Carto Voyager (tons escuros mas legíveis) — melhor contraste que dark_all puro */
const CARTO_BASE = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const OSM_FALLBACK = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function attachMapBaseLayers(map: L.Map): { primary: L.TileLayer; fallback: L.TileLayer } {
  const primary = L.tileLayer(CARTO_BASE, {
    maxZoom: 20,
    subdomains: "abcd",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    className: "map-tile-primary",
  });

  const fallback = L.tileLayer(OSM_FALLBACK, {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
    className: "map-tile-fallback",
  });

  let usingFallback = false;
  let errorCount = 0;

  primary.addTo(map);

  primary.on("tileerror", () => {
    errorCount += 1;
    if (usingFallback || errorCount < 8) return;
    usingFallback = true;
    map.removeLayer(primary);
    fallback.addTo(map);
  });

  return { primary, fallback };
}
