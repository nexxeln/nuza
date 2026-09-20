import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { FileIcon } from "../lib/utils"; import { fakeData } from "../lib/consts";
export default function Sidebar() {
  return (
    <aside className="flex h-full w-54 shrink-0 flex-col border-r border-zinc-800 text-zinc-300">
      <div className="px-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Explorer
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {fakeData.map((entry) => (
            <li key={entry.path}>
              {entry.isDirectory ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-zinc-800/25 hover:text-white [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform group-open:rotate-90" />
                    <Folder className="h-4 w-4 shrink-0 text-yellow-500 group-open:hidden" />
                    <FolderOpen className="hidden h-4 w-4 shrink-0 text-yellow-500 group-open:block" />

                    <span className="truncate">{entry.name}</span>
                  </summary>

                  <ul className="ml-3 border-l border-zinc-800 pl-2 cursor-pointer">
                    {entry.children?.map((child) => (
                      <li key={child.path}>
                        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-800/25 hover:text-zinc-100">
                          <FileIcon name={child.name} />

                          <span className="truncate">{child.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-800/25 hover:text-zinc-100">
                  <FileIcon name={entry.name} />

                  <span className="truncate">{entry.name}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
