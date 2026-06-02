import { useEffect, useRef, useState } from "react";
import { geocodePlace } from "../services/geocodingService";
import type { GeocodeResult } from "../types";

type AddressSearchProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  selected: GeocodeResult | null;
  onQueryChange: (query: string) => void;
  onSelect: (result: GeocodeResult | null) => void;
};

export function AddressSearch({
  id,
  label,
  placeholder,
  value,
  selected,
  onQueryChange,
  onSelect,
}: AddressSearchProps) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      setIsSearching(true);
      void geocodePlace(value)
        .then((results) => {
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setNoResults(results.length === 0 && value.trim().length >= 3);
        })
        .finally(() => setIsSearching(false));
    }, 450);

    return () => window.clearTimeout(debounceRef.current);
  }, [value]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="address-search" ref={wrapRef}>
      <label className="address-search__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="address-search__input"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(event) => {
          onQueryChange(event.target.value);
          onSelect(null);
        }}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
      />
      {isSearching && <span className="address-search__status">Buscando endereços…</span>}
      {selected && !isOpen && (
        <span className="address-search__selected">
          {selected.source === "nominatim" ? "📍" : "◎"} {selected.label.slice(0, 60)}
          {selected.label.length > 60 ? "…" : ""}
        </span>
      )}
      {noResults && !isSearching && !selected && value.trim().length >= 3 && (
        <p className="address-search__empty" role="status">
          Não encontramos esse endereço. Tente informar bairro, cidade ou ponto de referência.
        </p>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="address-search__list" role="listbox">
          {suggestions.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`}>
              <button
                type="button"
                role="option"
                className="address-search__option"
                onClick={() => {
                  onQueryChange(item.label.split(",").slice(0, 2).join(","));
                  onSelect(item);
                  setIsOpen(false);
                }}
              >
                <strong>{item.label.split(",")[0]}</strong>
                <span>
                  {item.label.split(",").slice(1).join(",").trim() || "São Paulo"}
                  {item.source === "fallback" ? " · sugestão local" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
