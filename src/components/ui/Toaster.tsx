import { useToastStore } from "../../store/useToastStore";

export default function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium max-w-xs ${
            toast.type === "success"
              ? "bg-warm-900 border-warm-700 text-warm-100"
              : toast.type === "error"
              ? "bg-red-900 border-red-700 text-red-100"
              : "bg-warm-800 border-warm-700 text-warm-200"
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-warm-400 hover:text-warm-200 ml-1 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
