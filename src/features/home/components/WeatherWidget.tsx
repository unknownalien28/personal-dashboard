import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useWeatherStore } from "@/features/home/weather-store";
import { describeWeatherCode } from "@/features/home/weather-codes";

async function fetchWeatherForCoords(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`
  );
  if (!res.ok) throw new Error("Weather request failed");
  const data = await res.json();
  return {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code as number,
  };
}

async function geocodeCity(city: string) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  const match = data.results?.[0];
  if (!match) throw new Error("City not found");
  return { lat: match.latitude, lon: match.longitude, name: match.name as string };
}

export function WeatherWidget() {
  const { manualCity, lastResult, setManualCity, setResult } = useWeatherStore();
  const [status, setStatus] = useState<"loading" | "ready" | "needsCity" | "error">(
    lastResult ? "ready" : "loading"
  );
  const [cityInput, setCityInput] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (manualCity) {
          const { lat, lon, name } = await geocodeCity(manualCity);
          const weather = await fetchWeatherForCoords(lat, lon);
          if (cancelled) return;
          setResult({ cityName: name, ...weather, fetchedAt: new Date().toISOString() });
          setStatus("ready");
          return;
        }

        if (!navigator.geolocation) {
          setStatus("needsCity");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const weather = await fetchWeatherForCoords(pos.coords.latitude, pos.coords.longitude);
              if (cancelled) return;
              setResult({ cityName: "Your location", ...weather, fetchedAt: new Date().toISOString() });
              setStatus("ready");
            } catch {
              if (!cancelled) setStatus(lastResult ? "ready" : "error");
            }
          },
          () => {
            if (!cancelled) setStatus("needsCity");
          },
          { timeout: 8000 }
        );
      } catch {
        if (!cancelled) setStatus(lastResult ? "ready" : "error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualCity]);

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cityInput.trim()) {
      setStatus("loading");
      setManualCity(cityInput.trim());
    }
  }

  if (status === "needsCity" && !lastResult) {
    return (
      <Card className="p-5">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          Location access wasn't available. Enter a city for weather:
        </p>
        <form onSubmit={handleCitySubmit} className="flex gap-2">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="e.g. Ilorin"
            className="flex-1 h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <button className="h-9 px-3 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors">
            Set
          </button>
        </form>
      </Card>
    );
  }

  if (status === "loading" && !lastResult) {
    return (
      <Card className="p-5 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading weather...
      </Card>
    );
  }

  if (status === "error" && !lastResult) {
    return (
      <Card className="p-5 text-sm text-zinc-500 dark:text-zinc-400">
        Couldn't load weather right now.
      </Card>
    );
  }

  if (!lastResult) return null;

  const { label, icon: Icon } = describeWeatherCode(lastResult.weatherCode);

  return (
    <Card className="p-5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <MapPin className="h-3.5 w-3.5" />
          {lastResult.cityName}
        </div>
        <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
          {lastResult.temperature}°C
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      </div>
      <Icon className="h-10 w-10 text-accent-400" />
    </Card>
  );
}
