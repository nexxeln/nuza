import { useState, useRef } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { getCM, vim, Vim } from "@replit/codemirror-vim";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { invoke } from "@tauri-apps/api/core";
import { PanelLeft, Save } from "lucide-react";
import Sidebar from "./components/Sidebar";
import { FileEntry } from "./lib/types";

function App() {
  const [value, setValue] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<string>("untitled.md");
  const [mode, setMode] = useState<string>("normal");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [folderData, setFolderData] = useState<FileEntry[]>([]);

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const now = new Date().toLocaleString();

  // Refs to always access the latest state inside the Vim closure
  const valueRef = useRef(value);
  const currentFileRef = useRef(currentFile);
  valueRef.current = value;
  currentFileRef.current = currentFile;

  const handleOpenFolder = async () => {
    try {
      const result = await invoke<FileEntry[] | null>("load_folder_picker");
      if (result) {
        setFolderData(result);
        setIsSidebarOpen(true);
      }
    } catch (error) {
      console.error("Failed to load folder:", error);
    }
  };

  const handleSave = async () => {
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
  };

  const handleFileSelect = async (path: string) => {
    try {
      const content = await invoke<string>("read_file", { path });
      setValue(content);
      setCurrentFile(path);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  }

  return (
    <main className="h-screen flex flex-col text-white bg-transparent overflow-hidden">
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
            onClick={handleSave}
          >
            <Save size={14} />
            <span>Save</span>
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
            extensions={[markdown(), vim(), EditorView.lineWrapping]}
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
        {mode === "insert" ? (
          <span className="text-xs uppercase px-4 h-full flex items-center bg-[#96FF96] text-black w-fit">
            --{mode}--
          </span>
        ) : mode === "normal" ? (
          <span className="text-xs uppercase px-4 h-full flex items-center bg-[#9696FF] text-black w-fit">
            --{mode}--
          </span>
        ) : mode === "visual" ? (
          <span className="text-xs uppercase px-4 h-full flex items-center bg-[#FFFF96] text-black w-fit">
            --{mode}--
          </span>
        ) : null}
        <span className="font-light text-xs text-gray-400 flex items-center gap-2 h-full">
          {currentFile.split("/").pop() || "untitled.md"}
          <span className="text-xs font-medium uppercase px-4 h-full flex items-center bg-[#FF9696] text-black w-fit ml-2">
            {now}
          </span>
        </span>
      </div>
    </main>
  );
}

export default App;
