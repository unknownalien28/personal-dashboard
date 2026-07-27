import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";

interface WeatherResult {
  cityName: string;
  temperature: number;
  weatherCode: number;
  fetchedAt: string;
}

interface WeatherState {
  manualCity: string | null;
  lastResult: WeatherResult | null;
  setManualCity: (city: string | null) => void;
  setResult: (result: WeatherResult) => void;
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set) => ({
      manualCity: null,
      lastResult: null,
      setManualCity: (city) => set({ manualCity: city }),
      setResult: (result) => set({ lastResult: result }),
    }),
    {
      name: `${STORAGE_PREFIX}weather`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
