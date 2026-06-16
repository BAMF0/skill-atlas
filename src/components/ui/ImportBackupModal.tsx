import { useState } from "react";
import Modal from "./Modal";
import type { BackupFile, ImportMode } from "../../lib/backup";
import { importBackup } from "../../lib/backup";
import { useSkillStore } from "../../store/useSkillStore";
import { useToastStore } from "../../store/useToastStore";

interface Props {
  isOpen: boolean;
  backup: BackupFile | null;
  onClose: () => void;
}

export default function ImportBackupModal({ isOpen, backup, onClose }: Props) {
  const [mode, setMode] = useState<ImportMode>("merge");
  const [loading, setLoading] = useState(false);
  const { loadSkills } = useSkillStore();
  const { addToast } = useToastStore();

  if (!backup) return null;

  const skillCount = backup.skills.length;
  const questCount = backup.skills.reduce((n, s) => n + s.quests.length, 0);
  const resourceCount = backup.skills.reduce((n, s) => n + s.resources.length, 0);
  const materialCount = backup.skills.reduce((n, s) => n + (s.materials?.length ?? 0), 0);
  const exportDate = new Date(backup.exportedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleImport() {
    if (!backup) return;
    setLoading(true);
    try {
      const imported = await importBackup(backup, mode);
      useSkillStore.setState({ initialized: false });
      await loadSkills();
      addToast(`Imported ${imported} skill${imported !== 1 ? "s" : ""}`, "success");
      onClose();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import backup" maxWidth="max-w-sm">
      <div className="space-y-4">
        {/* Backup summary */}
        <div className="bg-warm-50 border border-warm-200 rounded-lg px-4 py-3 text-sm text-warm-700 space-y-1">
          <p className="font-medium text-warm-900">{exportDate}</p>
          <p>
            {skillCount} skill{skillCount !== 1 ? "s" : ""} &middot;{" "}
            {questCount} quest{questCount !== 1 ? "s" : ""} &middot;{" "}
            {resourceCount} resource{resourceCount !== 1 ? "s" : ""}
            {materialCount > 0 && (
              <> &middot; {materialCount} material{materialCount !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>

        {/* Mode selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-warm-800">Import mode</p>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="importMode"
              value="merge"
              checked={mode === "merge"}
              onChange={() => setMode("merge")}
              className="mt-0.5 accent-warm-900"
            />
            <div>
              <p className="text-sm font-medium text-warm-900">Merge</p>
              <p className="text-xs text-warm-500">Add skills from the backup alongside your existing ones</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="importMode"
              value="replace"
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
              className="mt-0.5 accent-warm-900"
            />
            <div>
              <p className="text-sm font-medium text-warm-900">Replace</p>
              <p className="text-xs text-red-500">Delete all current data and restore from backup</p>
            </div>
          </label>
        </div>

        {mode === "replace" && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            This will permanently delete all your current skills and progress.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm text-warm-700 bg-warm-100 hover:bg-warm-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-warm-900 hover:bg-warm-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
