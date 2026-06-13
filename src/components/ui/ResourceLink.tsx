import type { Resource } from "../../types";
import { deleteResource } from "../../lib/operations";

const TYPE_ABBR: Record<string, string> = {
  book: "Bk",
  article: "Art",
  video: "Vid",
  course: "Crs",
  website: "Web",
};

interface ResourceLinkProps {
  resource: Resource;
  onDeleted?: () => void;
}

export default function ResourceLink({ resource, onDeleted }: ResourceLinkProps) {
  const abbr = TYPE_ABBR[resource.type] ?? "Ref";

  const handleDelete = async () => {
    if (!confirm(`Delete "${resource.title}"?`)) return;
    await deleteResource(resource.id);
    onDeleted?.();
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-warm-200 rounded-lg group hover:border-warm-300 transition-colors">
      <span className="text-xs font-medium text-warm-400 bg-warm-100 rounded px-1.5 py-1 flex-shrink-0 mt-0.5 tabular-nums tracking-tight">
        {abbr}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-warm-700 hover:text-warm-900 truncate block underline underline-offset-2 decoration-warm-300"
                onClick={(e) => e.stopPropagation()}
              >
                {resource.title}
              </a>
            ) : (
              <span className="text-sm font-medium text-warm-800">{resource.title}</span>
            )}
            {resource.author && (
              <p className="text-xs text-warm-400 mt-0.5">{resource.author}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-warm-300 hover:text-red-400 text-xs transition-opacity"
            >
              ✕
            </button>
          </div>
        </div>
        {resource.notes && (
          <p className="text-xs text-warm-400 mt-1 italic">{resource.notes}</p>
        )}
      </div>
    </div>
  );
}
