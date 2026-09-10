import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

function App() {
  const [value, setValue] = useState<string>("");

  return (
    <main className="h-screen flex flex-col text-white bg-transparent">
      <header
        data-tauri-drag-region
        className="h-12 shrink-0 flex items-center justify-between px-4 pl-24"
      >
        {/* Left side - after traffic lights */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Untitled</span>
        </div>

        {/* Right side - actions */}
        <div className="flex items-center gap-3">
          <button
            data-tauri-drag-region="false"
            className="text-sm text-gray-400 hover:text-white"
          >
            Save
          </button>
          <button
            data-tauri-drag-region="false"
            className="text-sm text-gray-400 hover:text-white"
          >
            Load
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 px-4">
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[markdown()]}
          onChange={(value) => setValue(value)}
          className="h-full text-xl border-none outline-none"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
        />
      </div>
    </main>
  );
}

export default App;
