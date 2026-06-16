import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Skill, Quest, Resource, Material, XpLogEntry, CompleteQuestResult } from "../types";
import {
  getSkill,
  getQuests,
  getResourcesForSkill,
  getMaterialsForSkill,
  getXpLog,
  getLastCompletionPerQuest,
  createResource,
  createMaterial,
  deleteMaterial,
  deleteSkill,
  updateSkill,
} from "../lib/operations";
import { useSkillStore } from "../store/useSkillStore";
import { useToastStore } from "../store/useToastStore";
import XpBar from "../components/skill/XpBar";
import LevelBadge from "../components/skill/LevelBadge";
import QuestList from "../components/quest/QuestList";
import ResourceLink from "../components/ui/ResourceLink";
import Modal from "../components/ui/Modal";
import { QuestImportModal } from "../components/ui/JsonImportModal";
import QuestDeck from "../components/quest/QuestDeck";
import { RESOURCE_TYPES, SKILL_COLORS, MATERIAL_CATEGORIES } from "../types";
import { xpToReachLevel, MAX_LEVEL, getLevelTitle } from "../lib/xpCurve";

type Tab = "quests" | "materials" | "resources" | "history";

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { upsertSkill, removeSkill } = useSkillStore();
  const { addToast } = useToastStore();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [xpLog, setXpLog] = useState<XpLogEntry[]>([]);
  const [lastCompletion, setLastCompletion] = useState<Record<number, string>>({});
  const [tab, setTab] = useState<Tab>("quests");
  const [loading, setLoading] = useState(true);

  const [showImportQuests, setShowImportQuests] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showAddResource, setShowAddResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "", author: "", type: "book", url: "", notes: "",
  });
  const [savingResource, setSavingResource] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    name: "", category: "equipment", notes: "", url: "", is_optional: false,
  });
  const [savingMaterial, setSavingMaterial] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", description: "", short_description: "", level_roadmap: "", category: "", color: "", icon: "",
  });

  const skillId = parseInt(id ?? "0");

  const loadAll = useCallback(async () => {
    if (!skillId) return;
    const [s, qs, rs, ms, log, lc] = await Promise.all([
      getSkill(skillId),
      getQuests(skillId),
      getResourcesForSkill(skillId),
      getMaterialsForSkill(skillId),
      getXpLog(skillId),
      getLastCompletionPerQuest(skillId),
    ]);
    if (!s) { navigate("/"); return; }
    setSkill(s);
    setQuests(qs);
    setResources(rs);
    setMaterials(ms);
    setXpLog(log);
    setLastCompletion(lc);
    setLoading(false);
  }, [skillId, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleQuestCompleted = async (result: CompleteQuestResult) => {
    if (result.leveledUp) {
      addToast(`Level Up! You reached ${result.newLevelTitle} (Level ${result.newLevel})`, "success");
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

  const handleAddMaterial = async () => {
    if (!materialForm.name.trim()) return;
    setSavingMaterial(true);
    try {
      await createMaterial({
        skill_id: skillId,
        name: materialForm.name.trim(),
        category: materialForm.category || undefined,
        notes: materialForm.notes.trim() || undefined,
        url: materialForm.url.trim() || undefined,
        is_optional: materialForm.is_optional,
      });
      setMaterialForm({ name: "", category: "equipment", notes: "", url: "", is_optional: false });
      setShowAddMaterial(false);
      const ms = await getMaterialsForSkill(skillId);
      setMaterials(ms);
    } finally {
      setSavingMaterial(false);
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
      short_description: skill.short_description ?? "",
      level_roadmap: skill.level_roadmap ?? "",
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
      short_description: editForm.short_description.trim() || undefined,
      level_roadmap: editForm.level_roadmap.trim() || undefined,
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
      {/* Header */}
      <div className="bg-white dark:bg-warm-200 border-b border-warm-200 px-4 md:px-8 pt-4 md:pt-5 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-2.5">
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

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {!editing && <LevelBadge level={skill.current_level} size="md" />}
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
                <button
                  onClick={() => { setEditing(false); setDeleteInput(""); setShowDeleteConfirm(true); }}
                  className="px-3 py-1.5 text-red-300 hover:text-red-500 text-xs font-medium transition-colors"
                >
                  Delete skill
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                className="px-3 py-1.5 bg-warm-100 hover:bg-warm-200 text-warm-600 rounded-lg text-xs font-medium transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="mb-3 space-y-2">
            <textarea
              value={editForm.short_description}
              onChange={(e) => setEditForm((f) => ({ ...f, short_description: e.target.value }))}
              placeholder="Short description (1–2 sentences)"
              rows={2}
              className="w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
            />
            <textarea
              value={editForm.level_roadmap}
              onChange={(e) => setEditForm((f) => ({ ...f, level_roadmap: e.target.value }))}
              placeholder="Level roadmap (levels 1–10)"
              rows={5}
              className="w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
            />
          </div>
        ) : (
          <>
            {(skill.short_description || skill.description) && (
              <p className="text-sm text-warm-500 mb-2 leading-relaxed">
                {skill.short_description ?? skill.description}
              </p>
            )}
            {skill.level_roadmap && (
              <div className="mb-2 bg-warm-50 border border-warm-100 rounded-lg px-4 py-3">
                <button
                  onClick={() => setShowRoadmap((v) => !v)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <p className="text-xs font-medium text-warm-400 uppercase tracking-widest">Level Roadmap</p>
                  <span className="text-xs text-warm-300 ml-auto">{showRoadmap ? "▲" : "▼"}</span>
                </button>
                {showRoadmap && (
                  <p className="text-xs text-warm-500 leading-relaxed whitespace-pre-line mt-2">{skill.level_roadmap}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* XP info + bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-warm-400 tabular-nums">{skill.current_xp.toLocaleString()} XP</span>
          {nextLevelXp && (
            <span className="text-xs text-warm-300">
              · {(nextLevelXp - skill.current_xp).toLocaleString()} to {getLevelTitle(skill.current_level + 1)}
            </span>
          )}
        </div>
        <div className="pb-3">
          <XpBar currentXp={skill.current_xp} color={skill.color} showLabel={false} />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {(["quests", "materials", "resources", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors capitalize flex-shrink-0 ${
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {tab === "quests" && (
          <>
            <QuestDeck
              quests={quests}
              skillColor={skill.color}
              currentLevel={skill.current_level}
              lastCompletion={lastCompletion}
              onAccepted={() => getQuests(skillId).then(setQuests)}
            />

            <details className="mt-6 group">
              <summary className="text-xs text-warm-400 hover:text-warm-600 cursor-pointer list-none flex items-center gap-1 select-none">
                <span className="group-open:hidden">▸</span>
                <span className="hidden group-open:inline">▾</span>
                All quests
              </summary>
              <div className="mt-3">
                <QuestList
                  quests={quests}
                  skillId={skillId}
                  skillColor={skill.color}
                  currentLevel={skill.current_level}
                  onQuestCompleted={handleQuestCompleted}
                  onQuestDeleted={() => getQuests(skillId).then(setQuests)}
                  onQuestAdded={() => getQuests(skillId).then(setQuests)}
                  onQuestAccepted={() => getQuests(skillId).then(setQuests)}
                  onQuestUnaccepted={() => getQuests(skillId).then(setQuests)}
                />
              </div>
            </details>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowImportQuests(true)}
                className="text-xs text-warm-400 hover:text-warm-700 transition-colors"
              >
                Import from JSON
              </button>
            </div>
          </>
        )}

        {tab === "materials" && (
          <div className="space-y-3">
            {/* Required */}
            {materials.filter((m) => !m.is_optional).length > 0 && (
              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-widest mb-2">Required</p>
                <div className="space-y-1.5">
                  {materials.filter((m) => !m.is_optional).map((m) => (
                    <div key={m.id} className="flex items-start gap-3 px-4 py-3 bg-white dark:bg-warm-200 border border-warm-200 rounded-xl group">
                      {m.category && (
                        <span className="text-xs text-warm-400 bg-warm-50 border border-warm-100 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5 capitalize">
                          {m.category}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        {m.url ? (
                          <a href={m.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-warm-800 hover:text-warm-600 underline underline-offset-2">
                            {m.name}
                          </a>
                        ) : (
                          <p className="text-sm text-warm-800">{m.name}</p>
                        )}
                        {m.notes && <p className="text-xs text-warm-400 mt-0.5 italic">{m.notes}</p>}
                      </div>
                      <button
                        onClick={async () => { await deleteMaterial(m.id); setMaterials(await getMaterialsForSkill(skillId)); }}
                        className="opacity-0 group-hover:opacity-100 text-warm-300 hover:text-red-400 text-xs transition-opacity flex-shrink-0"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional */}
            {materials.filter((m) => m.is_optional).length > 0 && (
              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-widest mb-2 mt-4">Optional</p>
                <div className="space-y-1.5">
                  {materials.filter((m) => m.is_optional).map((m) => (
                    <div key={m.id} className="flex items-start gap-3 px-4 py-3 bg-white dark:bg-warm-200 border border-warm-100 rounded-xl opacity-75 group hover:opacity-100 transition-opacity">
                      {m.category && (
                        <span className="text-xs text-warm-300 bg-warm-50 border border-warm-100 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5 capitalize">
                          {m.category}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        {m.url ? (
                          <a href={m.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-warm-600 hover:text-warm-800 underline underline-offset-2">
                            {m.name}
                          </a>
                        ) : (
                          <p className="text-sm text-warm-600">{m.name}</p>
                        )}
                        {m.notes && <p className="text-xs text-warm-400 mt-0.5 italic">{m.notes}</p>}
                      </div>
                      <button
                        onClick={async () => { await deleteMaterial(m.id); setMaterials(await getMaterialsForSkill(skillId)); }}
                        className="opacity-0 group-hover:opacity-100 text-warm-300 hover:text-red-400 text-xs transition-opacity flex-shrink-0"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {materials.length === 0 && !showAddMaterial && (
              <div className="text-center py-12">
                <p className="font-serif text-warm-700 mb-1">No materials yet</p>
                <p className="text-sm text-warm-400">Add what you need to get started with this skill.</p>
              </div>
            )}

            {showAddMaterial ? (
              <div className="border border-warm-200 rounded-xl p-4 bg-white dark:bg-warm-200 space-y-3">
                <h3 className="font-serif text-sm font-semibold text-warm-800">Add Material</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Name"
                      value={materialForm.name}
                      onChange={(e) => setMaterialForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                    />
                  </div>
                  <select
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm((f) => ({ ...f, category: e.target.value }))}
                    className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
                  >
                    {MATERIAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-warm-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={materialForm.is_optional}
                      onChange={(e) => setMaterialForm((f) => ({ ...f, is_optional: e.target.checked }))}
                      className="rounded border-warm-300"
                    />
                    Optional
                  </label>
                  <div className="col-span-2">
                    <input
                      type="url"
                      placeholder="URL (optional)"
                      value={materialForm.url}
                      onChange={(e) => setMaterialForm((f) => ({ ...f, url: e.target.value }))}
                      className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Notes (optional)"
                      value={materialForm.notes}
                      onChange={(e) => setMaterialForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddMaterial(false)} className="px-3 py-1.5 text-xs text-warm-500 hover:text-warm-700">Cancel</button>
                  <button
                    onClick={handleAddMaterial}
                    disabled={savingMaterial || !materialForm.name.trim()}
                    className="px-4 py-1.5 bg-warm-900 hover:bg-warm-800 disabled:opacity-40 text-warm-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    {savingMaterial ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddMaterial(true)}
                className="w-full py-3 text-sm text-warm-400 hover:text-warm-600 border border-dashed border-warm-200 hover:border-warm-300 rounded-xl transition-colors"
              >
                + Add Material
              </button>
            )}
          </div>
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
              <div className="border border-warm-200 rounded-xl p-4 bg-white dark:bg-warm-200 space-y-3">
                <h3 className="font-serif text-sm font-semibold text-warm-800">Add Resource</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Title"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Author (optional)"
                    value={resourceForm.author}
                    onChange={(e) => setResourceForm((f) => ({ ...f, author: e.target.value }))}
                    className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                  />
                  <select
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm((f) => ({ ...f, type: e.target.value }))}
                    className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
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
                      className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Notes (optional)"
                      value={resourceForm.notes}
                      onChange={(e) => setResourceForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
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
                  className="flex items-center justify-between px-4 py-3 bg-white dark:bg-warm-200 border border-warm-200 rounded-lg"
                >
                  <div>
                    <p className="text-sm text-warm-800">
                      {entry.source === "quest_completion" && entry.quest_title
                        ? entry.quest_title
                        : entry.source === "manual"
                        ? "Manual XP"
                        : entry.source}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-warm-400 italic mt-0.5">{entry.note}</p>
                    )}
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
          className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 mb-4"
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
