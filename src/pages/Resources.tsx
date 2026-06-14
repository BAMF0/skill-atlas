import { useEffect, useState } from "react";
import { getAllResources, createResource } from "../lib/operations";
import { useSkillStore } from "../store/useSkillStore";
import ResourceLink from "../components/ui/ResourceLink";
import type { Resource } from "../types";
import { RESOURCE_TYPES } from "../types";

const TYPE_LABELS: Record<string, string> = {
  book: "Books", article: "Articles", video: "Videos", course: "Courses", website: "Websites",
};

export default function Resources() {
  const { skills, loadSkills } = useSkillStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSkill, setFilterSkill] = useState<number | "all">("all");
  const [filterType, setFilterType] = useState<string | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    skill_id: "", title: "", author: "", type: "book", url: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSkills();
    loadResources();
  }, [loadSkills]);

  const loadResources = async () => {
    setLoading(true);
    const rs = await getAllResources();
    setResources(rs);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createResource({
        skill_id: form.skill_id ? parseInt(form.skill_id) : undefined,
        title: form.title.trim(),
        author: form.author.trim() || undefined,
        type: form.type,
        url: form.url.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({ skill_id: "", title: "", author: "", type: "book", url: "", notes: "" });
      setShowAdd(false);
      await loadResources();
    } finally {
      setSaving(false);
    }
  };

  const filtered = resources.filter((r) => {
    if (filterSkill !== "all" && r.skill_id !== filterSkill) return false;
    if (filterType !== "all" && r.type !== filterType) return false;
    return true;
  });

  const grouped = RESOURCE_TYPES.reduce<Record<string, Resource[]>>((acc, type) => {
    const items = filtered.filter((r) => r.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-warm-900">Resource Library</h1>
          <p className="text-sm text-warm-400 mt-0.5">{resources.length} resource{resources.length !== 1 ? "s" : ""} across all skills</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-4 py-2 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          value={filterSkill === "all" ? "all" : String(filterSkill)}
          onChange={(e) => setFilterSkill(e.target.value === "all" ? "all" : parseInt(e.target.value))}
          className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
        >
          <option value="all">All Skills</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
        >
          <option value="all">All Types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="border border-warm-200 rounded-xl p-5 bg-white dark:bg-warm-200 mb-5 space-y-3">
          <h3 className="font-serif text-sm font-semibold text-warm-800">New Resource</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                autoFocus
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
              />
            </div>
            <input
              type="text"
              placeholder="Author (optional)"
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
            />
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <select
              value={form.skill_id}
              onChange={(e) => setForm((f) => ({ ...f, skill_id: e.target.value }))}
              className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
            >
              <option value="">No skill link</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
            <input
              type="url"
              placeholder="URL (optional)"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
            />
            <div className="col-span-2">
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs text-warm-500 hover:text-warm-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.title.trim()}
              className="px-4 py-1.5 bg-warm-900 hover:bg-warm-800 disabled:opacity-40 text-warm-50 rounded-lg text-xs font-medium transition-colors"
            >
              {saving ? "Adding…" : "Add Resource"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-4 h-4 border border-warm-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <p className="font-serif text-lg text-warm-700 mb-2">No resources yet</p>
          <p className="text-sm">Add books, courses, or articles to build your library.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <h2 className="text-xs font-medium text-warm-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                {TYPE_LABELS[type]}
                <span className="text-warm-300">({items.length})</span>
              </h2>
              <div className="space-y-2">
                {items.map((r) => (
                  <div key={r.id}>
                    {r.skill_name && (
                      <p className="text-xs text-warm-400 ml-2 mb-1">{r.skill_name}</p>
                    )}
                    <ResourceLink resource={r} onDeleted={loadResources} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
