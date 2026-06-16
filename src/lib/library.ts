import { invoke } from "@tauri-apps/api/core";
import { SKILL_LIBRARY } from "../data/skillLibrary";
import type { QuestTemplate, ResourceTemplate } from "../data/skillLibrary";

export type { QuestTemplate, ResourceTemplate };

export interface MaterialTemplate {
  name: string;
  category?: string;   // "equipment" | "software" | "consumables" | "space" | "other"
  notes?: string;
  url?: string;
  is_optional?: boolean;
}

export interface SkillModule {
  schema_version: 1;
  id: string;
  name: string;
  description: string;
  short_description?: string;
  level_roadmap?: string;
  category: string;
  icon: string;
  color: string;
  version: string;
  author?: string;
  tags?: string[];
  quests: QuestTemplate[];
  resources: ResourceTemplate[];
  materials?: MaterialTemplate[];
}

export interface RegistryModuleMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  version: string;
  author?: string;
  tags?: string[];
  file: string;
}

export interface RegistryIndex {
  schema_version: 1;
  modules: RegistryModuleMeta[];
}

export type ModuleSource = "builtin" | "local" | "remote";

export interface LibraryEntry {
  module: SkillModule | RegistryModuleMeta;
  source: ModuleSource;
  isInstalled: boolean;
  localFilename?: string;
}

export function isFullModule(m: SkillModule | RegistryModuleMeta): m is SkillModule {
  return "quests" in m;
}

export function parseModule(raw: unknown): SkillModule {
  if (typeof raw !== "object" || raw === null) throw new Error("Module must be a JSON object");
  const m = raw as Record<string, unknown>;
  if (m.schema_version !== 1) throw new Error(`Unknown schema_version: ${m.schema_version}`);
  if (typeof m.id !== "string" || !m.id) throw new Error("Module missing id");
  if (typeof m.name !== "string" || !m.name) throw new Error("Module missing name");
  if (!Array.isArray(m.quests)) throw new Error("Module quests must be an array");
  if (!Array.isArray(m.resources)) throw new Error("Module resources must be an array");
  return raw as SkillModule;
}

// ─── Local (file-based) ───────────────────────────────────────────────────────

export async function getLibraryDirPath(): Promise<string> {
  return invoke<string>("library_dir_path");
}

export async function listLocalModules(): Promise<SkillModule[]> {
  const rawList = await invoke<string[]>("list_library_modules");
  const modules: SkillModule[] = [];
  for (const raw of rawList) {
    try {
      modules.push(parseModule(JSON.parse(raw)));
    } catch {
      // skip malformed files
    }
  }
  return modules;
}

export async function saveModuleLocally(module: SkillModule): Promise<void> {
  const filename = `${module.id}.json`;
  const content = JSON.stringify(module, null, 2);
  await invoke("save_library_module", { filename, content });
}

// ─── Remote (registry) ───────────────────────────────────────────────────────

function registryBaseUrl(indexUrl: string): string {
  return indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);
}

export async function fetchRegistryIndex(registryUrl: string): Promise<RegistryIndex> {
  const resp = await fetch(registryUrl);
  if (!resp.ok) throw new Error(`Registry fetch failed: ${resp.status}`);
  const data = await resp.json();
  if (!Array.isArray(data?.modules)) throw new Error("Invalid registry format");
  return data as RegistryIndex;
}

export async function downloadRemoteModule(
  indexUrl: string,
  meta: RegistryModuleMeta
): Promise<SkillModule> {
  const url = registryBaseUrl(indexUrl) + meta.file;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Module download failed: ${resp.status}`);
  const data = await resp.json();
  return parseModule(data);
}

export async function installRemoteModule(
  indexUrl: string,
  meta: RegistryModuleMeta
): Promise<SkillModule> {
  const module = await downloadRemoteModule(indexUrl, meta);
  await saveModuleLocally(module);
  return module;
}

// ─── Combined ─────────────────────────────────────────────────────────────────

export async function buildLibraryEntries(registryUrl: string): Promise<{
  local: LibraryEntry[];
  remote: LibraryEntry[];
  registryError: string | null;
}> {
  let localModules: SkillModule[] = [];
  try {
    localModules = await listLocalModules();
  } catch {
    // not in a Tauri context or directory unreadable — fall back to built-ins only
  }
  const localIds = new Set(localModules.map((m) => m.id));

  const builtins: LibraryEntry[] = SKILL_LIBRARY.filter((t) => !localIds.has(t.id)).map((t) => ({
    module: { schema_version: 1 as const, version: "builtin", ...t },
    source: "builtin" as ModuleSource,
    isInstalled: false,
  }));

  const localEntries: LibraryEntry[] = localModules.map((m) => ({
    module: m,
    source: "local" as ModuleSource,
    isInstalled: true,
    localFilename: `${m.id}.json`,
  }));

  let remote: LibraryEntry[] = [];
  let registryError: string | null = null;

  if (registryUrl) {
    try {
      const index = await fetchRegistryIndex(registryUrl);
      remote = index.modules
        .filter((meta) => !localIds.has(meta.id))
        .map((meta): LibraryEntry => ({
          module: meta,
          source: "remote",
          isInstalled: false,
        }));
    } catch (e) {
      registryError = e instanceof Error ? e.message : "Failed to load registry";
    }
  }

  return {
    local: [...localEntries, ...builtins],
    remote,
    registryError,
  };
}
