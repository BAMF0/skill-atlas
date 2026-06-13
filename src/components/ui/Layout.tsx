import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useSkillStore } from "../../store/useSkillStore";
import Toaster from "./Toaster";
import { useToastStore } from "../../store/useToastStore";
import { exportBackup, pickBackupFile, type BackupFile } from "../../lib/backup";
import ImportBackupModal from "./ImportBackupModal";

export default function Layout() {
  const navigate = useNavigate();
  const { skills, loadSkills } = useSkillStore();
  const { addToast } = useToastStore();
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  async function handleExport() {
    try {
      const saved = await exportBackup();
      if (saved) addToast("Backup saved", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  }

  async function handleImportPick() {
    try {
      const backup = await pickBackupFile();
      if (backup) setPendingBackup(backup);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not read file", "error");
    }
  }

  return (
    <div className="flex h-screen bg-warm-50 text-warm-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-warm-100 border-r border-warm-200 flex flex-col flex-shrink-0">
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
                    isActive
                      ? "bg-white shadow-sm text-warm-900 font-medium"
                      : "text-warm-600 hover:text-warm-900 hover:bg-white/60"
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
                isActive
                  ? "bg-white shadow-sm text-warm-900 font-medium"
                  : "text-warm-600 hover:text-warm-900 hover:bg-white/60"
              }`
            }
          >
            Resources
          </NavLink>
        </div>

        {/* New skill */}
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
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-warm-50">
        <Outlet />
      </main>

      <Toaster />

      <ImportBackupModal
        isOpen={pendingBackup !== null}
        backup={pendingBackup}
        onClose={() => setPendingBackup(null)}
      />
    </div>
  );
}
