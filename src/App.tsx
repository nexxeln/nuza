import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { getCM, vim, Vim } from "@replit/codemirror-vim"; import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { PanelLeft, Save, RefreshCw, Settings } from "lucide-react";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import { FileEntry } from "./lib/types";
import { useKeymaps, useKeymapListener } from "./hooks/useKeymaps";

function App() {
  const [value, setValue] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<string>("untitled.md");
  const [mode, setMode] = useState<string>("normal");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [folderData, setFolderData] = useState<FileEntry[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [vimEnabled, setVimEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("vimEnabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [transparencyEnabled, setTransparencyEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("transparencyEnabled");
    return saved ? JSON.parse(saved) : true;
  });

  const { bindings: keymapBindings, setBinding: setKeymapBinding, resetBinding: resetKeymapBinding, resetAll: resetAllKeymaps } = useKeymaps();

  useEffect(() => {
    localStorage.setItem("vimEnabled", JSON.stringify(vimEnabled));
  }, [vimEnabled]);

  useEffect(() => {
    localStorage.setItem("transparencyEnabled", JSON.stringify(transparencyEnabled));
    invoke("set_transparency", { enabled: transparencyEnabled }).catch((error) => {
      console.error("Failed to update transparency:", error);
    });
  }, [transparencyEnabled]);

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const now = new Date().toLocaleString();

  // Refs to always access the latest state inside the Vim closure
  const valueRef = useRef(value);
  const currentFileRef = useRef(currentFile);
  valueRef.current = value;
  currentFileRef.current = currentFile;

  const handleOpenFolder = useCallback(async () => {
    try {
      const result = await invoke<FileEntry[] | null>("load_folder_picker");
      if (result) {
        setFolderData(result);
        setIsSidebarOpen(true);
      }
    } catch (error) {
      console.error("Failed to load folder:", error);
    }
  }, []);

  const handleUpdateCheck = useCallback(async () => {
    try {
      setIsUpdating(true);
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
      } else {
        console.log("No updates available");
      }
    } catch (error) {
      console.error("Failed to update:", error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const currentFileValue = currentFileRef.current;
      const contentValue = valueRef.current;

      if (currentFileValue !== "untitled.md") {
        // Direct save if we already have a real file path
        await invoke("write_file", { path: currentFileValue, content: contentValue });
      } else {
        // Otherwise, open the picker for a new file
        const savedPath = await invoke<string | null>("save_file_picker", {
          content: contentValue,
        });
        if (savedPath) setCurrentFile(savedPath);
      }
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }, []);

  const handleFileSelect = async (path: string) => {
    try {
      const content = await invoke<string>("read_file", { path });
      setValue(content);
      setCurrentFile(path);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  }

  const keymapHandlers = useMemo(
    () => ({
      "toggle-sidebar": () => setIsSidebarOpen((open) => !open),
      "save-file": handleSave,
      "open-folder": handleOpenFolder,
      "open-settings": () => setIsSettingsOpen((open) => !open),
      "toggle-vim-mode": () => setVimEnabled((enabled) => !enabled),
      "check-updates": handleUpdateCheck,
    }),
    [handleSave, handleOpenFolder, handleUpdateCheck]
  );

  useKeymapListener(keymapBindings, keymapHandlers);

  return (
    <main className={`h-screen flex flex-col text-white overflow-hidden ${transparencyEnabled ? "bg-transparent" : "bg-[#1E1E1E]"}`}>
      <header
        data-tauri-drag-region
        className="h-12 shrink-0 flex items-center justify-between px-4 pl-24"
      >
        {/* Left side - after traffic lights */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-400">nuza</span>
        </div>

        {/* Right side - actions */}
        <div className="flex items-center gap-3">
          <button
            data-tauri-drag-region="false"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            onClick={handleUpdateCheck}
            disabled={isUpdating}
          >
            <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
          </button>

          <button
            data-tauri-drag-region="false"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={14} />
          </button>
          
          <button
            data-tauri-drag-region="false"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            onClick={handleSave}
          >
            <Save size={14} />
          </button>

          <div className="border-l border-zinc-700 pl-3 flex items-center h-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors translate-y-[1px] cursor-pointer" 
            >
              <PanelLeft size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 px-4 flex gap-5 w-full relative z-20">
        <div className="flex-1 min-w-0 h-full relative">
          <CodeMirror
            ref={editorRef}
            value={value}
            height="100%"
            theme={oneDark}
            extensions={[markdown(), ...(vimEnabled ? [vim()] : []), EditorView.lineWrapping]}
            onChange={(value) => setValue(value)}
            className="h-full text-sm border-none outline-none"
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
            }}
            onCreateEditor={(view) => {
              const cm = getCM(view);
              if (!cm) return;
              // @ts-ignore
              cm.on("vim-mode-change", (e) => {
                setMode(e.mode);
              });

              Vim.defineEx("write", "w", async () => {
                await handleSave();
              });

              Vim.defineEx("wall", "wa", async () => {
                await handleSave();
              });
            }}
          />
        </div>
        {isSidebarOpen && <Sidebar data={folderData} onOpenFolder={handleOpenFolder} onFileSelect={handleFileSelect} />}
      </div>
      <div className="bg-[#1E1E1E] flex items-center justify-between font-bold font-mono shrink-0 h-7 relative z-10">
        {vimEnabled && mode === "insert" ? (
          <span className="text-xs uppercase px-4 h-full flex items-center bg-[#96FF96] text-black w-fit">
            --{mode}--
          </span>
        ) : vimEnabled && mode === "normal" ? (
          <span className="text-xs uppercase px-4 h-full flex items-center bg-[#9696FF] text-black w-fit">
            --{mode}--
          </span>
        ) : vimEnabled && mode === "visual" ? (
          <span className="text-xs uppercase px-4 h-full flex items-center bg-[#FFFF96] text-black w-fit">
            --{mode}--
          </span>
        ) : (
          <span className="text-xs uppercase px-4 h-full flex items-center w-fit">
          </span>
        )}
        <span className="font-light text-xs text-gray-400 flex items-center gap-2 h-full">
          {currentFile.split(/[/\\]/).pop() || "untitled.md"}
          <span className="text-xs font-medium uppercase px-4 h-full flex items-center bg-[#FF9696] text-black w-fit ml-2">
            {now}
          </span>
        </span>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vimEnabled={vimEnabled}
        setVimEnabled={setVimEnabled}
        transparencyEnabled={transparencyEnabled}
        setTransparencyEnabled={setTransparencyEnabled}
        keymapBindings={keymapBindings}
        setKeymapBinding={setKeymapBinding}
        resetKeymapBinding={resetKeymapBinding}
        resetAllKeymaps={resetAllKeymaps}
      />
    </main>
  );
}

export default App;
