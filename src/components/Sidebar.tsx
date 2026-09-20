import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { FileIcon } from "../lib/utils";
import { FileEntry } from "../lib/types";

function FileNode({ entry }: { entry: FileEntry }) {
  if (entry.isDirectory) {
    return (
      <li>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-zinc-800/25 hover:text-white [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform group-open:rotate-90" />
            <Folder className="h-4 w-4 shrink-0 text-yellow-500 group-open:hidden" />
            <FolderOpen className="hidden h-4 w-4 shrink-0 text-yellow-500 group-open:block" />

            <span className="truncate">{entry.name}</span>
          </summary>

          <ul className="ml-3 border-l border-zinc-800 pl-2 cursor-pointer">
            {entry.children?.map((child) => (
              <FileNode key={child.path} entry={child} />
            ))}
          </ul>
        </details>
      </li>
    );
  }

  return (
    <li>
      <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-800/25 hover:text-zinc-100">
        <FileIcon name={entry.name} />
        <span className="truncate">{entry.name}</span>
      </button>
    </li>
  );
}

export default function Sidebar({ data, onOpenFolder }: { data: FileEntry[]; onOpenFolder?: () => void }) {
  return (
    <aside className="flex h-full w-48 shrink-0 flex-col border-l border-zinc-700 text-zinc-300">
      <div className="px-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Explorer
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col">
        {!data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-start flex-1 text-center gap-3 mt-2">
            {onOpenFolder && (
              <button 
                onClick={onOpenFolder}
                className="text-xs bg-zinc-700 hover:bg-zinc-600 cursor-pointer text-white px-3 py-1.5 rounded transition-colors"
              >
                Open Folder
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {data.map((entry) => (
              <FileNode key={entry.path} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
