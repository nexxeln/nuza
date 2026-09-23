import { useEffect, useRef, useState } from "react";

/** Auto-focused text input used for inline rename/create rows in the file tree. */
export default function InlineInput({
  initialValue = "",
  onSubmit,
  onCancel,
  className,
}: {
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // Pre-select the basename (excluding extension) so renaming a file
    // doesn't force the user to retype ".md" etc.
    const dotIndex = initialValue.lastIndexOf(".");
    if (dotIndex > 0) {
      input.setSelectionRange(0, dotIndex);
    } else {
      input.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function settle(action: () => void) {
    if (settledRef.current) return;
    settledRef.current = true;
    action();
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue) {
      settle(onCancel);
      return;
    }
    settle(() => onSubmit(trimmed));
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          settle(onCancel);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className={className}
    />
  );
}
