import { PanelLeft, RefreshCw, Save, Settings } from "lucide-react";

interface EditorHeaderProps {
  isUpdating: boolean;
  version: string | null;
  onCheckUpdates: () => void;
  onOpenSettings: () => void;
  onSave: () => void;
  onToggleSidebar: () => void;
}

/** The draggable title bar: app name on the left, action buttons on the right. */
export default function EditorHeader({
  isUpdating,
  version,
  onCheckUpdates,
  onOpenSettings,
  onSave,
  onToggleSidebar,
}: EditorHeaderProps) {
  return (
    <header
      data-tauri-drag-region
      className="h-12 shrink-0 flex items-center justify-between px-4 pl-24"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-gray-400">nuza</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          data-tauri-drag-region="false"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
          onClick={onCheckUpdates}
          disabled={isUpdating}
          title="Check for updates"
        >
          <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
          {version && <span className="text-xs ">v{version}</span>}
        </button>

        <button
          data-tauri-drag-region="false"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
          onClick={onOpenSettings}
        >
          <Settings size={14} />
        </button>

        <button
          data-tauri-drag-region="false"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
          onClick={onSave}
        >
          <Save size={14} />
        </button>

        <div className="border-l border-zinc-700 pl-3 flex items-center h-4">
          <button
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white transition-colors translate-y-[1px] cursor-pointer"
          >
            <PanelLeft size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
