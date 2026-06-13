import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Skill, Quest, Resource, XpLogEntry, CompleteQuestResult } from "../types";
import {
  getSkill,
  getQuests,
  getResourcesForSkill,
  getXpLog,
  createResource,
  deleteSkill,
  updateSkill,
} from "../lib/operations";
import { useSkillStore } from "../store/useSkillStore";
import { useToastStore } from "../store/useToastStore";
import XpBar from "../components/skill/XpBar";
import LevelBadge from "../components/skill/LevelBadge";
import QuestList from "../components/quest/QuestList";
import ResourceLink from "../components/ui/ResourceLink";
import ConfettiEffect from "../components/ui/ConfettiEffect";
import Modal from "../components/ui/Modal";
import { QuestImportModal } from "../components/ui/JsonImportModal";
import { RESOURCE_TYPES, SKILL_COLORS } from "../types";
import { xpToReachLevel, MAX_LEVEL, getLevelTitle } from "../lib/xpCurve";

type Tab = "quests" | "resources" | "history";

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { upsertSkill, removeSkill } = useSkillStore();
  const { addToast } = useToastStore();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [xpLog, setXpLog] = useState<XpLogEntry[]>([]);
  const [tab, setTab] = useState<Tab>("quests");
  const [confetti, setConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showImportQuests, setShowImportQuests] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showAddResource, setShowAddResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "", author: "", type: "book", url: "", notes: "",
  });
  const [savingResource, setSavingResource] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", description: "", category: "", color: "", icon: "",
  });

  const skillId = parseInt(id ?? "0");

  const loadAll = useCallback(async () => {
    if (!skillId) return;
    const [s, qs, rs, log] = await Promise.all([
      getSkill(skillId),
      getQuests(skillId),
      getResourcesForSkill(skillId),
      getXpLog(skillId),
    ]);
    if (!s) { navigate("/"); return; }
    setSkill(s);
    setQuests(qs);
    setResources(rs);
    setXpLog(log);
    setLoading(false);
  }, [skillId, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleQuestCompleted = async (result: CompleteQuestResult) => {
    if (result.leveledUp) {
      setConfetti(true);
      addToast(`Level Up! You reached ${result.newLevelTitle} (Level ${result.newLevel})`, "success");
      setTimeout(() => setConfetti(false), 100);
    } else {
      addToast(`+${result.xpGained} XP earned`, "info");
    }
    const updated = await getSkill(skillId);
    if (updated) { setSkill(updated); upsertSkill(updated); }
    const [qs, log] = await Promise.all([getQuests(skillId), getXpLog(skillId)]);
    setQuests(qs);
    setXpLog(log);
  };

  const handleAddResource = async () => {
    if (!resourceForm.title.trim()) return;
    setSavingResource(true);
    try {
      await createResource({
        skill_id: skillId,
        title: resourceForm.title.trim(),
        author: resourceForm.author.trim() || undefined,
        type: resourceForm.type,
        url: resourceForm.url.trim() || undefined,
        notes: resourceForm.notes.trim() || undefined,
      });
      setResourceForm({ title: "", author: "", type: "book", url: "", notes: "" });
      setShowAddResource(false);
      const rs = await getResourcesForSkill(skillId);
      setResources(rs);
    } finally {
      setSavingResource(false);
    }
  };

  const handleDelete = async () => {
    if (!skill) return;
    await deleteSkill(skill.id);
    removeSkill(skill.id);
    navigate("/");
  };

  const startEdit = () => {
    if (!skill) return;
    setEditForm({
      name: skill.name,
      description: skill.description ?? "",
      category: skill.category ?? "",
      color: skill.color,
      icon: skill.icon ?? "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!skill || !editForm.name.trim()) return;
    await updateSkill(skill.id, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      category: editForm.category.trim() || undefined,
      color: editForm.color,
      icon: editForm.icon.trim() || undefined,
    });
    const updated = await getSkill(skill.id);
    if (updated) { setSkill(updated); upsertSkill(updated); }
    setEditing(false);
  };

  if (loading || !skill) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-4 h-4 border border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextLevelXp = skill.current_level < MAX_LEVEL
    ? xpToReachLevel(skill.current_level + 1)
    : null;

  return (
    <div className="flex flex-col h-full">
      <ConfettiEffect trigger={confetti} />

      {/* Header */}
      <div className="bg-white border-b border-warm-200 px-8 pt-7 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {editing ? (
              <input
                type="text"
                value={editForm.icon}
                onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                className="text-2xl w-12 bg-warm-50 border border-warm-200 rounded-lg text-center focus:outline-none focus:border-warm-400"
                maxLength={4}
              />
            ) : (
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: skill.color }}
              >
                {skill.icon || skill.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              {editing ? (
                <input
                  autoFocus
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="font-serif text-xl font-semibold bg-warm-50 border border-warm-200 rounded-lg px-3 py-1 text-warm-900 focus:outline-none focus:border-warm-400"
                />
              ) : (
                <h1 className="font-serif text-xl font-semibold text-warm-900">{skill.name}</h1>
              )}
              {editing ? (
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Category"
                  className="text-sm bg-warm-50 border border-warm-200 rounded-lg px-2 py-1 mt-1 text-warm-700 focus:outline-none focus:border-warm-400"
                />
              ) : (
                skill.category && (
                  <p className="text-sm text-warm-400 mt-0.5">{skill.category}</p>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {editing ? (
              <>
                <div className="flex gap-1.5">
                  {SKILL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, color: c }))}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        boxShadow: editForm.color === c ? `0 0 0 2px #FAFAF7, 0 0 0 3.5px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-lg text-xs font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="px-3 py-1.5 bg-warm-100 hover:bg-warm-200 text-warm-600 rounded-lg text-xs font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { setDeleteInput(""); setShowDeleteConfirm(true); }}
                  className="px-3 py-1.5 text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={2}
            className="mb-3 w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
          />
        )}
        {!editing && skill.description && (
          <p className="text-sm text-warm-500 mb-3 leading-relaxed">{skill.description}</p>
        )}

        {/* Level + XP */}
        <div className="flex items-center gap-3 mb-3">
          <LevelBadge level={skill.current_level} size="md" />
          <span className="text-xs text-warm-400 tabular-nums">{skill.current_xp.toLocaleString()} XP</span>
          {nextLevelXp && (
            <span className="text-xs text-warm-300">
              · {(nextLevelXp - skill.current_xp).toLocaleString()} to {getLevelTitle(skill.current_level + 1)}
            </span>
          )}
        </div>
        <div className="pb-4">
          <XpBar currentXp={skill.current_xp} color={skill.color} showLabel={false} />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          {(["quests", "resources", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-warm-900 text-warm-900 font-medium"
                  : "border-transparent text-warm-400 hover:text-warm-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8">
        {tab === "quests" && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowImportQuests(true)}
                className="text-xs text-warm-400 hover:text-warm-700 transition-colors"
              >
                Import from JSON
              </button>
            </div>
          <QuestList
            quests={quests}
            skillId={skillId}
            skillColor={skill.color}
            currentLevel={skill.current_level}
            onQuestCompleted={handleQuestCompleted}
            onQuestDeleted={() => getQuests(skillId).then(setQuests)}
            onQuestAdded={() => getQuests(skillId).then(setQuests)}
          />
          </>
        )}

        {tab === "resources" && (
          <div className="space-y-3">
            {resources.length === 0 && !showAddResource && (
              <div className="text-center py-12">
                <p className="font-serif text-warm-700 mb-1">No resources yet</p>
                <p className="text-sm text-warm-400">Add books, articles, or courses to guide your learning.</p>
              </div>
            )}
            {resources.map((r) => (
              <ResourceLink
                key={r.id}
                resource={r}
                onDeleted={() => getResourcesForSkill(skillId).then(setResources)}
              />
            ))}

            {showAddResource ? (
              <div className="border border-warm-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="font-serif text-sm font-semibold text-warm-800">Add Resource</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Title"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Author (optional)"
                    value={resourceForm.author}
                    onChange={(e) => setResourceForm((f) => ({ ...f, author: e.target.value }))}
                    className="bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                  />
                  <select
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm((f) => ({ ...f, type: e.target.value }))}
                    className="bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <div className="col-span-2">
                    <input
                      type="url"
                      placeholder="URL (optional)"
                      value={resourceForm.url}
                      onChange={(e) => setResourceForm((f) => ({ ...f, url: e.target.value }))}
                      className="w-full bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Notes (optional)"
                      value={resourceForm.notes}
                      onChange={(e) => setResourceForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowAddResource(false)}
                    className="px-3 py-1.5 text-xs text-warm-500 hover:text-warm-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddResource}
                    disabled={savingResource || !resourceForm.title.trim()}
                    className="px-4 py-1.5 bg-warm-900 hover:bg-warm-800 disabled:opacity-40 text-warm-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    {savingResource ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddResource(true)}
                className="w-full py-3 text-sm text-warm-400 hover:text-warm-600 border border-dashed border-warm-200 hover:border-warm-300 rounded-xl transition-colors"
              >
                + Add Resource
              </button>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {xpLog.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-serif text-warm-700 mb-1">No XP history yet</p>
                <p className="text-sm text-warm-400">Complete quests to earn XP and see your progress here.</p>
              </div>
            ) : (
              xpLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 bg-white border border-warm-200 rounded-lg"
                >
                  <div>
                    <p className="text-sm text-warm-800">
                      {entry.source === "quest_completion" && entry.quest_title
                        ? entry.quest_title
                        : entry.source === "manual"
                        ? `Manual XP${entry.note ? ` — ${entry.note}` : ""}`
                        : entry.source}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {new Date(entry.logged_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: skill.color }}
                  >
                    +{entry.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showImportQuests && (
        <QuestImportModal
          skillId={skillId}
          skillName={skill.name}
          onClose={() => setShowImportQuests(false)}
          onImported={() => getQuests(skillId).then(setQuests)}
        />
      )}

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete skill"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-warm-600 mb-1">
          This will permanently delete <span className="font-medium text-warm-900">{skill.name}</span> and
          all its quests, resources, and XP history. This cannot be undone.
        </p>
        <p className="text-sm text-warm-500 mb-4">
          Type <span className="font-mono text-warm-800 bg-warm-100 px-1 py-0.5 rounded">{skill.name}</span> to confirm.
        </p>
        <input
          autoFocus
          type="text"
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && deleteInput === skill.name) handleDelete();
          }}
          placeholder={skill.name}
          className="w-full bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-sm text-warm-500 hover:text-warm-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteInput !== skill.name}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
