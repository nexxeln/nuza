import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "cn";
import { eventToBinding, formatBinding, isCompleteBinding } from "@/lib/keybinding";

interface KeyRecorderProps {
  binding: string;
  defaultBinding: string;
  onChange: (binding: string) => void;
  onReset: () => void;
}

/** A button that shows the current shortcut and, on click, captures the next key combo pressed. */
export default function KeyRecorder({ binding, defaultBinding, onChange, onReset }: KeyRecorderProps) {
  const [recording, setRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!recording) return;

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecording(false);
        return;
      }

      const next = eventToBinding(e);
      if (!isCompleteBinding(next)) return;

      onChange(next);
      setRecording(false);
    }

    const button = buttonRef.current;
    window.addEventListener("keydown", onKeyDown, true);
    button?.addEventListener("blur", () => setRecording(false));
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [recording, onChange]);

  const isCustom = binding !== defaultBinding;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        ref={buttonRef}
        onClick={() => setRecording(true)}
        className={cn(
          "min-w-[92px] rounded-md border px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer text-center",
          recording
            ? "border-primary/70 bg-primary/10 text-primary"
            : "border-zinc-700 bg-zinc-800/60 text-gray-300 hover:border-zinc-600 hover:text-white"
        )}
      >
        {recording ? "Press keys…" : formatBinding(binding) || "Unbound"}
      </button>
      {isCustom && (
        <button
          onClick={onReset}
          title="Reset to default"
          className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
}
