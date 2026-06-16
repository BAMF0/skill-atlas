import { create } from "zustand";

const STORAGE_KEY = "skillatlas.settings";

export interface Settings {
  ollamaEnabled: boolean;
  ollamaModel: string;
  libraryRegistryUrl: string;
}

const DEFAULTS: Settings = {
  ollamaEnabled: false,
  ollamaModel: "llama3.1",
  libraryRegistryUrl: "",
};

interface SettingsStore extends Settings {
  setOllamaEnabled: (v: boolean) => void;
  setOllamaModel: (v: string) => void;
  setLibraryRegistryUrl: (v: string) => void;
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // fall through to defaults
  }
  return DEFAULTS;
}

function persist(s: Settings) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ollamaEnabled: s.ollamaEnabled,
      ollamaModel: s.ollamaModel,
      libraryRegistryUrl: s.libraryRegistryUrl,
    })
  );
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...load(),
  setOllamaEnabled: (v) => {
    set({ ollamaEnabled: v });
    persist(get());
  },
  setOllamaModel: (v) => {
    set({ ollamaModel: v });
    persist(get());
  },
  setLibraryRegistryUrl: (v) => {
    set({ libraryRegistryUrl: v });
    persist(get());
  },
}));
