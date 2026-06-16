import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildLibraryEntries,
  getLibraryDirPath,
  installRemoteModule,
  isFullModule,
  type LibraryEntry,
  type RegistryModuleMeta,
  type SkillModule,
} from "../../lib/library";
import { useSettingsStore } from "../../store/useSettingsStore";

interface LibraryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (module: SkillModule) => void;
}

type Tab = "local" | "remote";

function ModuleCard({
  entry,
  onSelect,
  onInstall,
  installing,
}: {
  entry: LibraryEntry;
  onSelect?: () => void;
  onInstall?: () => void;
  installing: boolean;
}) {
  const m = entry.module;
  const questCount = isFullModule(m) ? m.quests.length : null;

  return (
    <div className="relative text-left p-4 bg-white dark:bg-warm-200 border border-warm-200 rounded-xl transition-all group flex flex-col gap-2">
      {entry.source === "builtin" && (
        <span className="absolute top-3 right-3 text-[10px] font-medium text-warm-400 bg-warm-100 rounded px-1.5 py-0.5">
          Built-in
        </span>
      )}

      <div className="flex items-center gap-2.5">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: m.color }}
        >
          {m.icon || m.name.charAt(0)}
        </span>
        <span className="font-serif text-sm font-semibold text-warm-900 group-hover:text-warm-700 pr-10">
          {m.name}
        </span>
      </div>

      <p className="text-xs text-warm-500 line-clamp-2 leading-relaxed flex-1">{m.description}</p>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2 text-xs text-warm-400">
          <span>{m.category}</span>
          {questCount !== null && <span>· {questCount} quests</span>}
          {m.author && <span>· {m.author}</span>}
        </div>

        {onSelect && (
          <button
            onClick={onSelect}
            className="text-xs px-2.5 py-1 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-lg transition-colors"
          >
            Use
          </button>
        )}
        {onInstall && (
          <button
            onClick={onInstall}
            disabled={installing}
            className="text-xs px-2.5 py-1 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {installing ? (
              <>
                <span className="inline-block w-3 h-3 border border-warm-400 border-t-transparent rounded-full animate-spin" />
                Installing…
              </>
            ) : (
              "Install"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LibraryBrowser({ isOpen, onClose, onSelectModule }: LibraryBrowserProps) {
  const { libraryRegistryUrl } = useSettingsStore();

  const [tab, setTab] = useState<Tab>("local");
  const [localEntries, setLocalEntries] = useState<LibraryEntry[]>([]);
  const [remoteEntries, setRemoteEntries] = useState<LibraryEntry[]>([]);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [libraryPath, setLibraryPath] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [entries, dirPath] = await Promise.all([
        buildLibraryEntries(libraryRegistryUrl),
        getLibraryDirPath().catch(() => ""),
      ]);
      setLocalEntries(entries.local);
      setRemoteEntries(entries.remote);
      setRegistryError(entries.registryError);
      setLibraryPath(dirPath);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function handleInstall(entry: LibraryEntry) {
    const meta = entry.module as RegistryModuleMeta;
    setInstalling(meta.id);
    try {
      const module = await installRemoteModule(libraryRegistryUrl, meta);
      setRemoteEntries((prev) => prev.filter((e) => e.module.id !== meta.id));
      setLocalEntries((prev) => [
        { module, source: "local", isInstalled: true, localFilename: `${module.id}.json` },
        ...prev,
      ]);
    } catch (e) {
      setRegistryError(e instanceof Error ? e.message : "Install failed");
    } finally {
      setInstalling(null);
    }
  }

  function handleSelect(entry: LibraryEntry) {
    if (!isFullModule(entry.module)) return;
    onSelectModule(entry.module);
    onClose();
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-warm-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-warm-200 border border-warm-200 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 flex-shrink-0">
          <h2 className="font-serif text-base font-semibold text-warm-900">Skill Library</h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-700 text-lg leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-warm-200 flex-shrink-0 px-6">
          {(["local", "remote"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${
                tab === t
                  ? "border-warm-900 text-warm-900"
                  : "border-transparent text-warm-400 hover:text-warm-700"
              }`}
            >
              {t === "local" ? `Local${localEntries.length ? ` (${localEntries.length})` : ""}` : "Remote"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 min-h-[20rem]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-warm-400 text-sm">Loading…</div>
          ) : tab === "local" ? (
            <>
              {localEntries.length === 0 ? (
                <p className="text-sm text-warm-400 text-center py-10">No modules installed yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localEntries.map((entry) => (
                    <ModuleCard
                      key={`${entry.source}-${entry.module.id}`}
                      entry={entry}
                      onSelect={isFullModule(entry.module) ? () => handleSelect(entry) : undefined}
                      installing={false}
                    />
                  ))}
                </div>
              )}

              {libraryPath && (
                <div className="mt-6 p-3 bg-warm-50 border border-warm-200 rounded-lg">
                  <p className="text-xs text-warm-500 mb-1 font-medium">Library directory</p>
                  <p className="text-xs text-warm-400 font-mono break-all">{libraryPath}</p>
                  <p className="text-xs text-warm-400 mt-1">
                    Drop <span className="font-mono">.json</span> skill module files here to add them to your library.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {registryError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3">
                  <p className="text-xs text-red-700">{registryError}</p>
                  <button
                    onClick={load}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex-shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!libraryRegistryUrl && !registryError && (
                <p className="text-sm text-warm-400 text-center py-10">
                  No registry URL configured. Add one in{" "}
                  <span className="font-medium text-warm-700">Settings → Library Registry URL</span>.
                </p>
              )}

              {remoteEntries.length === 0 && libraryRegistryUrl && !registryError && (
                <p className="text-sm text-warm-400 text-center py-10">
                  All available modules are already installed.
                </p>
              )}

              {remoteEntries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {remoteEntries.map((entry) => (
                    <ModuleCard
                      key={entry.module.id}
                      entry={entry}
                      onInstall={() => handleInstall(entry)}
                      installing={installing === entry.module.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
