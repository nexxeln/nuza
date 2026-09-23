import { useCallback, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileEntry } from "@/lib/types";

const UNTITLED_FILE = "untitled.md";

interface UseFileOperationsOptions {
  /** Called after a folder is successfully opened, e.g. to reveal the sidebar. */
  onFolderOpened?: () => void;
}

/** Owns the editor's document state and every Tauri file-system round trip. */
export function useFileOperations({ onFolderOpened }: UseFileOperationsOptions = {}) {
  const [value, setValue] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<string>(UNTITLED_FILE);
  const [folderData, setFolderData] = useState<FileEntry[]>([]);

  // Vim's `:w` command runs outside of React, from a closure captured once
  // when the editor mounts, so it can't see state updates directly - it
  // reads through these refs instead to always get the latest value.
  const valueRef = useRef(value);
  const currentFileRef = useRef(currentFile);
  valueRef.current = value;
  currentFileRef.current = currentFile;

  const openFolder = useCallback(async () => {
    try {
      const result = await invoke<FileEntry[] | null>("load_folder_picker");
      if (result) {
        setFolderData(result);
        onFolderOpened?.();
      }
    } catch (error) {
      console.error("Failed to load folder:", error);
    }
  }, [onFolderOpened]);

  const save = useCallback(async () => {
    try {
      const path = currentFileRef.current;
      const content = valueRef.current;

      if (path !== UNTITLED_FILE) {
        // Direct save if we already have a real file path
        await invoke("write_file", { path, content });
      } else {
        // Otherwise, open the picker for a new file
        const savedPath = await invoke<string | null>("save_file_picker", { content });
        if (savedPath) setCurrentFile(savedPath);
      }
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }, []);

  const selectFile = useCallback(async (path: string) => {
    try {
      const content = await invoke<string>("read_file", { path });
      setValue(content);
      setCurrentFile(path);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  }, []);

  return { value, setValue, currentFile, folderData, openFolder, save, selectFile };
}
