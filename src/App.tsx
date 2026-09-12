import { useState, useRef } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { getCM, vim, Vim } from "@replit/codemirror-vim";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

function App() {
  const [value, setValue] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<string>("untitled.md");
  const [mode, setMode] = useState<string>("normal");

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const now = new Date().toLocaleString();

  const handleLoad = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Markdown Files",
          extensions: ["md", "markdown"],
        },
      ],
    });
    if (selected) {
      const cotent = await readTextFile(selected as string);
      setCurrentFile(selected as string);
      setValue(cotent);
    }
  };

  const handleSave = async () => {
    const selected = await save({
      filters: [
        {
          name: "Markdown Files",
          extensions: ["md", "markdown"],
        },
      ],
      defaultPath: "untitled.md",
    });
    if (selected) {
      await writeTextFile(selected as string, value);
      setCurrentFile(selected as string);
    }
  };

  return (
    <main className="h-screen flex flex-col text-white bg-transparent">
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
            className="text-sm text-gray-400 hover:text-white"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            data-tauri-drag-region="false"
            className="text-sm text-gray-400 hover:text-white"
            onClick={handleLoad}
          >
            Open
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 px-4">
        <CodeMirror
          ref={editorRef}
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[markdown(), vim()]}
          onChange={(value) => setValue(value)}
          className="h-full text-xl border-none outline-none"
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
      <div className="bg-[#1E1E1E] flex items-center justify-between font-bold">
        {mode === "insert" ? (
          <span className="text-xs uppercase px-4 py-1 bg-[#96FF96] text-black w-fit">
            --{mode}--
          </span>
        ) : mode === "normal" ? (
          <span className="text-xs uppercase px-4 py-1 bg-[#9696FF] text-black w-fit">
            --{mode}--
          </span>
        ) : mode === "visual" ? (
          <span className="text-xs uppercase px-4 py-1 bg-[#FFFF96] text-black w-fit">
            --{mode}--
          </span>
        ) : null}
        <span className="font-light text-xs text-gray-400 flex items-center gap-2">
          {currentFile.split("/").pop() || "untitled.md"}
          <span className="text-xs font-medium uppercase px-4 py-1 bg-[#FF9696] text-black w-fit">
            {now}
          </span>
        </span>
      </div>
    </main>
  );
}

export default App;
