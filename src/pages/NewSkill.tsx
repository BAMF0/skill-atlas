import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSkill, importSkillTemplate } from "../lib/operations";
import { useSkillStore } from "../store/useSkillStore";
import { SKILL_COLORS } from "../types";
import { SKILL_LIBRARY, type SkillTemplate } from "../data/skillLibrary";
import { SkillImportModal } from "../components/ui/JsonImportModal";

type Step = "library" | "customize";

export default function NewSkill() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("library");
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SkillTemplate | null>(null);
  const [importQuests, setImportQuests] = useState(true);
  const [importResources, setImportResources] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    color: SKILL_COLORS[0],
    icon: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pickTemplate = (template: SkillTemplate) => {
    setSelectedTemplate(template);
    setForm({
      name: template.name,
      description: template.description,
      category: template.category,
      color: template.color,
      icon: template.icon,
    });
    setStep("customize");
  };

  const pickBlank = () => {
    setSelectedTemplate(null);
    setForm({ name: "", description: "", category: "", color: SKILL_COLORS[0], icon: "" });
    setStep("customize");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const id = await createSkill({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        color: form.color,
        icon: form.icon.trim() || undefined,
      });

      if (selectedTemplate) {
        await importSkillTemplate(id, selectedTemplate, { importQuests, importResources });
      }

      // Reset initialized so loadSkills fetches fresh data
      useSkillStore.setState({ initialized: false });
      await useSkillStore.getState().loadSkills();

      navigate(`/skill/${id}`);
    } catch (err) {
      setError("Failed to create skill. Please try again.");
      setSaving(false);
    }
  };

  const CATEGORIES = [
    "Art", "Music", "Programming", "Fitness", "Language",
    "Cooking", "Science", "Writing", "Business", "Strategy", "Other",
  ];

  if (step === "library") {
    return (
      <>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <button onClick={() => navigate(-1)} className="text-warm-400 hover:text-warm-700 text-sm transition-colors">
            ← Back
          </button>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-warm-900">Add a Skill</h1>
            <p className="text-sm text-warm-400 mt-0.5">Choose from our library or start blank</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {SKILL_LIBRARY.map((template) => (
            <button
              key={template.id}
              onClick={() => pickTemplate(template)}
              className="text-left p-4 bg-white border border-warm-200 hover:border-warm-300 hover:shadow-sm rounded-xl transition-all group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: template.color }}
                >
                  {template.name.charAt(0)}
                </span>
                <span className="font-serif text-sm font-semibold text-warm-900 group-hover:text-warm-700">
                  {template.name}
                </span>
              </div>
              <p className="text-xs text-warm-500 line-clamp-2 leading-relaxed">{template.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-warm-300">{template.category}</span>
                <span className="text-xs text-warm-300">{template.quests.length} quests</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={pickBlank}
            className="flex-1 py-3 border border-dashed border-warm-300 hover:border-warm-400 rounded-xl text-sm text-warm-500 hover:text-warm-700 transition-colors"
          >
            Start blank →
          </button>
          <button
            onClick={() => setShowJsonImport(true)}
            className="flex-1 py-3 border border-dashed border-warm-300 hover:border-warm-400 rounded-xl text-sm text-warm-500 hover:text-warm-700 transition-colors"
          >
            Import from JSON →
          </button>
        </div>
      </div>

      {showJsonImport && (
        <SkillImportModal
          onClose={() => setShowJsonImport(false)}
          onImported={(id) => navigate(`/skill/${id}`)}
        />
      )}
      </>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={() => setStep("library")}
          className="text-warm-400 hover:text-warm-700 text-sm transition-colors"
        >
          ← Back
        </button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-warm-900">
            {selectedTemplate ? `Set up ${selectedTemplate.name}` : "New Skill"}
          </h1>
          <p className="text-sm text-warm-400 mt-0.5">Customise before saving</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Preview */}
        <div className="p-4 rounded-xl bg-white border border-warm-200 flex items-center gap-3">
          <div
            className="w-1 self-stretch rounded-full"
            style={{ backgroundColor: form.color }}
          />
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: form.color }}
          >
            {form.icon || (form.name.charAt(0).toUpperCase() || "?")}
          </span>
          <div>
            <p className="font-serif text-sm font-semibold text-warm-900">{form.name || "Skill Name"}</p>
            <p className="text-xs text-warm-400 mt-0.5">{form.category || "Category"} · Level 1</p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-warm-500 uppercase tracking-widest mb-1.5">
            Name
          </label>
          <input
            type="text"
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Guitar, Python, Drawing…"
            className="w-full bg-white border border-warm-200 rounded-lg px-4 py-2.5 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-warm-500 uppercase tracking-widest mb-1.5">
            Description <span className="normal-case text-warm-300">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What's your goal with this skill?"
            rows={2}
            className="w-full bg-white border border-warm-200 rounded-lg px-4 py-2.5 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-warm-500 uppercase tracking-widest mb-1.5">
            Category
          </label>
          <input
            type="text"
            list="categories"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="e.g. Music"
            className="w-full bg-white border border-warm-200 rounded-lg px-3 py-2.5 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
          />
          <datalist id="categories">
            {CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-warm-500 uppercase tracking-widest mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {SKILL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: c,
                  boxShadow: form.color === c ? `0 0 0 2.5px #FAFAF7, 0 0 0 4px ${c}` : "none",
                  transform: form.color === c ? "scale(1.1)" : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Template import options */}
        {selectedTemplate && (
          <div className="border border-warm-200 rounded-xl p-4 bg-warm-50 space-y-2">
            <p className="text-xs font-medium text-warm-500 uppercase tracking-widest mb-3">
              From {selectedTemplate.name} template
            </p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={importQuests}
                onChange={(e) => setImportQuests(e.target.checked)}
                className="rounded border-warm-300 w-4 h-4"
              />
              <div>
                <span className="text-sm text-warm-800">Import starter quests</span>
                <span className="ml-2 text-xs text-warm-400">({selectedTemplate.quests.length} quests)</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={importResources}
                onChange={(e) => setImportResources(e.target.checked)}
                className="rounded border-warm-300 w-4 h-4"
              />
              <div>
                <span className="text-sm text-warm-800">Import starter resources</span>
                <span className="ml-2 text-xs text-warm-400">({selectedTemplate.resources.length} resources)</span>
              </div>
            </label>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setStep("library")}
            className="flex-1 px-4 py-2.5 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-lg text-sm font-medium transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="flex-1 px-4 py-2.5 bg-warm-900 hover:bg-warm-800 disabled:opacity-40 text-warm-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Creating…" : "Create Skill"}
          </button>
        </div>
      </form>
    </div>
  );
}
