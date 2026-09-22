import { ReactNode } from "react";

interface SettingRowProps {
  title: string;
  description: string;
  children: ReactNode;
}

/** A label + description on the left, a control on the right. Shared layout for every settings row. */
export default function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}
