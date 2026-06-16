import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSkillStore } from "../../store/useSkillStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import Toaster from "./Toaster";
import Modal from "./Modal";
import { useToastStore } from "../../store/useToastStore";
import { exportBackup, pickBackupFile, type BackupFile } from "../../lib/backup";
import ImportBackupModal from "./ImportBackupModal";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { skills, loadSkills } = useSkillStore();
  const { addToast } = useToastStore();
  const { isDark, toggle } = useThemeStore();
  const { ollamaEnabled, ollamaModel, setOllamaEnabled, setOllamaModel, libraryRegistryUrl, setLibraryRegistryUrl } = useSettingsStore();
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isHome = location.pathname === "/";

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  async function handleExport() {
    setShowOverflow(false);
    try {
      const saved = await exportBackup();
      if (saved) addToast("Backup saved", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  }

  async function handleImportPick() {
    setShowOverflow(false);
    try {
      const backup = await pickBackupFile();
      if (backup) setPendingBackup(backup);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not read file", "error");
    }
  }

  const navActive = "bg-warm-200 dark:bg-warm-200 text-warm-900 font-medium";
  const navIdle = "text-warm-600 hover:text-warm-900 hover:bg-warm-200/60";

  return (
    <div className="flex h-screen bg-warm-50 text-warm-900 overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 bg-warm-100 border-r border-warm-200 flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-warm-200">
          <NavLink to="/" className="block">
            <h1 className="font-serif text-base font-semibold text-warm-900 tracking-tight">
              Skill Atlas
            </h1>
            <p className="text-xs text-warm-500 mt-0.5">Track your growth</p>
          </NavLink>
        </div>

        {/* Skill list */}
        <div className="flex-1 overflow-y-auto py-3">
          {skills.length > 0 && (
            <p className="px-5 text-xs font-medium text-warm-400 uppercase tracking-widest mb-2">
              Skills
            </p>
          )}
          <div className="space-y-0.5 px-2">
            {skills.map((skill) => (
              <NavLink
                key={skill.id}
                to={`/skill/${skill.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? navActive : navIdle
                  }`
                }
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: skill.color }}
                />
                <span className="flex-1 truncate">{skill.name}</span>
                <span className="text-xs text-warm-400 flex-shrink-0">
                  {skill.current_level}
                </span>
              </NavLink>
            ))}
          </div>

          {skills.length === 0 && (
            <p className="px-5 text-xs text-warm-400 italic mt-1">No skills yet</p>
          )}
        </div>

        {/* Nav links */}
        <div className="border-t border-warm-200 px-2 py-2">
          <NavLink
            to="/resources"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? navActive : navIdle
              }`
            }
          >
            Resources
          </NavLink>
        </div>

        {/* New skill + actions */}
        <div className="p-3 border-t border-warm-200 space-y-2">
          <button
            onClick={() => navigate("/skill/new")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-lg text-sm font-medium transition-colors"
          >
            <span className="text-base leading-none">+</span>
            New Skill
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={handleExport}
              title="Export backup"
              className="flex-1 px-2 py-1.5 text-xs text-warm-600 hover:text-warm-900 bg-transparent hover:bg-warm-200 rounded-md transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleImportPick}
              title="Import backup"
              className="flex-1 px-2 py-1.5 text-xs text-warm-600 hover:text-warm-900 bg-transparent hover:bg-warm-200 rounded-md transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => setShowSettings(true)}
              title="Settings"
              className="px-2 py-1.5 text-warm-600 hover:text-warm-900 bg-transparent hover:bg-warm-200 rounded-md transition-colors text-sm leading-none"
            >
              ⚙
            </button>
            <button
              onClick={toggle}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="px-2 py-1.5 text-warm-600 hover:text-warm-900 bg-transparent hover:bg-warm-200 rounded-md transition-colors text-sm leading-none"
            >
              {isDark ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-12 bg-warm-100 border-b border-warm-200 flex items-center px-4 gap-3">
        {!isHome ? (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-warm-600 hover:text-warm-900 -ml-1"
          >
            ‹
          </button>
        ) : (
          <div className="w-8" />
        )}
        <span className="font-serif text-sm font-semibold text-warm-900 flex-1">Skill Atlas</span>
        <div className="relative">
          <button
            onClick={() => setShowOverflow((v) => !v)}
            className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-900 text-lg leading-none"
          >
            ···
          </button>
          {showOverflow && (
            <>
              <div className="fixed inset-0" onClick={() => setShowOverflow(false)} />
              <div className="absolute right-0 top-9 bg-warm-50 border border-warm-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                <button
                  onClick={() => { toggle(); setShowOverflow(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-warm-700 hover:bg-warm-100"
                >
                  {isDark ? "☀ Light mode" : "☾ Dark mode"}
                </button>
                <div className="border-t border-warm-200 my-1" />
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-2 text-sm text-warm-700 hover:bg-warm-100"
                >
                  Export backup
                </button>
                <button
                  onClick={handleImportPick}
                  className="w-full text-left px-4 py-2 text-sm text-warm-700 hover:bg-warm-100"
                >
                  Import backup
                </button>
                <div className="border-t border-warm-200 my-1" />
                <button
                  onClick={() => { setShowSettings(true); setShowOverflow(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-warm-700 hover:bg-warm-100"
                >
                  Settings
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-warm-50 pt-12 md:pt-0 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-warm-100 border-t border-warm-200 flex items-center">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-xs transition-colors ${
              isActive ? "text-warm-900 font-medium" : "text-warm-500"
            }`
          }
        >
          <span className="text-base leading-none">⌂</span>
          <span>Home</span>
        </NavLink>

        <button
          onClick={() => navigate("/skill/new")}
          className="flex-shrink-0 mx-4 w-12 h-12 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-full flex items-center justify-center text-xl font-light shadow-md active:scale-95 transition-transform"
        >
          +
        </button>

        <NavLink
          to="/resources"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-xs transition-colors ${
              isActive ? "text-warm-900 font-medium" : "text-warm-500"
            }`
          }
        >
          <span className="text-base leading-none">◎</span>
          <span>Resources</span>
        </NavLink>
      </nav>

      <Toaster />

      <ImportBackupModal
        isOpen={pendingBackup !== null}
        backup={pendingBackup}
        onClose={() => setPendingBackup(null)}
      />

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" maxWidth="max-w-xs">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-warm-800 mb-1">Local AI generation (Ollama)</p>
            <p className="text-xs text-warm-500 mb-3">
              Generate skills and quests with a model running locally via{" "}
              <span className="font-mono text-warm-700">Ollama</span> — nothing leaves your device.
              The manual copy-paste flow always remains available.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ollamaEnabled}
                onChange={(e) => setOllamaEnabled(e.target.checked)}
                className="rounded border-warm-300 w-4 h-4"
              />
              <span className="text-sm text-warm-800">Enable local generation</span>
            </label>
          </div>

          {ollamaEnabled && (
            <div>
              <label className="block text-xs font-medium text-warm-500 uppercase tracking-widest mb-1.5">
                Model
              </label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="e.g. llama3.1"
                className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
              />
              <p className="text-xs text-warm-400 mt-1.5">
                Must be an installed Ollama model (run <span className="font-mono">ollama pull {ollamaModel || "llama3.1"}</span>).
                A <span className="font-mono">Generate</span> button appears in the import dialogs when Ollama is running.
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-warm-800 mb-1">Skill module registry</p>
            <p className="text-xs text-warm-500 mb-3">
              URL to a compatible <span className="font-mono text-warm-700">index.json</span> registry.
              Used by the Skill Library browser to fetch and install remote modules.
            </p>
            <input
              type="text"
              value={libraryRegistryUrl}
              onChange={(e) => setLibraryRegistryUrl(e.target.value)}
              placeholder="https://raw.githubusercontent.com/…/index.json"
              className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-lg text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
