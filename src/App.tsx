import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { getCM, vim, Vim } from "@replit/codemirror-vim";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { invoke } from "@tauri-apps/api/core";
import EditorHeader from "./components/EditorHeader";
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import { useKeymaps, useKeymapListener } from "./hooks/useKeymaps";
import { useFileOperations } from "./hooks/useFileOperations";
import { useAppUpdater } from "./hooks/useAppUpdater";
import { usePersistedState } from "./hooks/usePersistedState";

function App() {
  const [mode, setMode] = useState<string>("normal");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [vimEnabled, setVimEnabled] = usePersistedState("vimEnabled", true);
  const [transparencyEnabled, setTransparencyEnabled] = usePersistedState("transparencyEnabled", true);

  const {
    value,
    setValue,
    currentFile,
    folderData,
    rootPath,
    openFolder,
    save,
    selectFile,
    createFile,
    createFolder,
    renameEntry,
    moveEntry,
    deleteEntry,
  } = useFileOperations({
    onFolderOpened: () => setIsSidebarOpen(true),
  });
  const { isUpdating, checkForUpdates } = useAppUpdater();
  const { bindings: keymapBindings, setBinding: setKeymapBinding, resetBinding: resetKeymapBinding, resetAll: resetAllKeymaps } = useKeymaps();

  useEffect(() => {
    invoke("set_transparency", { enabled: transparencyEnabled }).catch((error) => {
      console.error("Failed to update transparency:", error);
    });
  }, [transparencyEnabled]);

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const now = new Date().toLocaleString();

  const keymapHandlers = useMemo(
    () => ({
      "toggle-sidebar": () => setIsSidebarOpen((open) => !open),
      "save-file": save,
      "open-folder": openFolder,
      "open-settings": () => setIsSettingsOpen((open) => !open),
      "toggle-vim-mode": () => setVimEnabled((enabled) => !enabled),
      "check-updates": checkForUpdates,
    }),
    [save, openFolder, checkForUpdates, setVimEnabled]
  );

  useKeymapListener(keymapBindings, keymapHandlers);

  const handleEditorCreated = useCallback(
    (view: EditorView) => {
      const cm = getCM(view);
      if (!cm) return;
      // @ts-ignore - codemirror-vim's event isn't typed
      cm.on("vim-mode-change", (e) => setMode(e.mode));

      Vim.defineEx("write", "w", async () => {
        await save();
      });
      Vim.defineEx("wall", "wa", async () => {
        await save();
      });
    },
    [save]
  );

  return (
    <main className={`h-screen flex flex-col text-white overflow-hidden ${transparencyEnabled ? "bg-transparent" : "bg-[#1E1E1E]"}`}>
      <EditorHeader
        isUpdating={isUpdating}
        onCheckUpdates={checkForUpdates}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSave={save}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      <div className="flex-1 min-h-0 px-4 flex gap-5 w-full relative z-20">
        <div className="flex-1 min-w-0 h-full relative">
          <CodeMirror
            ref={editorRef}
            value={value}
            height="100%"
            theme={oneDark}
            extensions={[markdown(), ...(vimEnabled ? [vim()] : []), EditorView.lineWrapping]}
            onChange={setValue}
            className="h-full text-sm border-none outline-none"
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
            }}
            onCreateEditor={handleEditorCreated}
          />
        </div>
        {isSidebarOpen && (
          <Sidebar
            data={folderData}
            rootPath={rootPath}
            onOpenFolder={openFolder}
            onFileSelect={selectFile}
            currentFile={currentFile}
            onCreateFile={createFile}
            onCreateFolder={createFolder}
            onRename={renameEntry}
            onDelete={deleteEntry}
            onMove={moveEntry}
          />
        )}
      </div>

      <StatusBar vimEnabled={vimEnabled} mode={mode} currentFile={currentFile} timestamp={now} />

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
