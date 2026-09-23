import { useCallback, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileEntry } from "@/lib/types";

const UNTITLED_FILE = "untitled.md";

interface UseFileOperationsOptions {
  /** Called after a folder is successfully opened, e.g. to reveal the sidebar. */
  onFolderOpened?: () => void;
}

interface OpenedFolder {
  path: string;
  entries: FileEntry[];
}

/** True if `path` is `ancestor` itself, or lives somewhere underneath it. */
function isWithin(path: string, ancestor: string) {
  return path === ancestor || path.startsWith(ancestor + "/") || path.startsWith(ancestor + "\\");
}

/** Owns the editor's document state and every Tauri file-system round trip. */
export function useFileOperations({ onFolderOpened }: UseFileOperationsOptions = {}) {
  const [value, setValue] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<string>(UNTITLED_FILE);
  const [folderData, setFolderData] = useState<FileEntry[]>([]);
  const [rootPath, setRootPath] = useState<string | null>(null);

  // Vim's `:w` command runs outside of React, from a closure captured once
  // when the editor mounts, so it can't see state updates directly - it
  // reads through these refs instead to always get the latest value.
  const valueRef = useRef(value);
  const currentFileRef = useRef(currentFile);
  const rootPathRef = useRef(rootPath);
  const fileCacheRef = useRef<Record<string, string>>({});

  valueRef.current = value;
  currentFileRef.current = currentFile;
  rootPathRef.current = rootPath;

  const openFolder = useCallback(async () => {
    try {
      const result = await invoke<OpenedFolder | null>("load_folder_picker");
      if (result) {
        setRootPath(result.path);
        setFolderData(result.entries);
        
        setCurrentFile(UNTITLED_FILE);
        setValue("");
        fileCacheRef.current = {};

        onFolderOpened?.();
      }
    } catch (error) {
      console.error("Failed to load folder:", error);
    }
  }, [onFolderOpened]);

  const refreshFolder = useCallback(async () => {
    const path = rootPathRef.current;
    if (!path) return;
    try {
      const entries = await invoke<FileEntry[]>("read_folder", { path });
      setFolderData(entries);
    } catch (error) {
      console.error("Failed to refresh folder:", error);
    }
  }, []);

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
        if (savedPath) {
          setCurrentFile(savedPath);
          fileCacheRef.current[savedPath] = content;
          delete fileCacheRef.current[UNTITLED_FILE];
        }
      }
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }, []);

  const selectFile = useCallback(async (path: string) => {
    try {
      if (currentFileRef.current) {
        fileCacheRef.current[currentFileRef.current] = valueRef.current;
      }

      if (path in fileCacheRef.current) {
        setValue(fileCacheRef.current[path]);
        setCurrentFile(path);
      } else {
        const content = await invoke<string>("read_file", { path });
        fileCacheRef.current[path] = content;
        setValue(content)
        setCurrentFile(path);
      }
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  }, []);

  const createFile = useCallback(
    async (parentPath: string, name: string) => {
      await invoke("create_file", { parentPath, name });
      await refreshFolder();
    },
    [refreshFolder]
  );

  const createFolder = useCallback(
    async (parentPath: string, name: string) => {
      await invoke("create_folder", { parentPath, name });
      await refreshFolder();
    },
    [refreshFolder]
  );

  const renameEntry = useCallback(
    async (path: string, newName: string) => {
      const newPath = await invoke<string>("rename_entry", { path, newName });
      await refreshFolder();

      for (const key of Object.keys(fileCacheRef.current)) {
        if (isWithin(key, path)) {
          const updatedPath = key.replace(path, newPath);
          fileCacheRef.current[updatedPath] = fileCacheRef.current[key];
          delete fileCacheRef.current[key];
        }
      }

      if (isWithin(currentFileRef.current, path)) {
        setCurrentFile(currentFileRef.current.replace(path, newPath));
      }
    },
    [refreshFolder]
  );

  const moveEntry = useCallback(
    async (path: string, targetDir: string) => {
      const newPath = await invoke<string>("move_entry", { path, targetDir });
      await refreshFolder();

      for (const key of Object.keys(fileCacheRef.current)) {
        if (isWithin(key, path)) {
          const updatedPath = key.replace(path, newPath);
          fileCacheRef.current[updatedPath] = fileCacheRef.current[key];
          delete fileCacheRef.current[key];
        }
      }

      if (isWithin(currentFileRef.current, path)) {
        setCurrentFile(currentFileRef.current.replace(path, newPath));
      }
    },
    [refreshFolder]
  );

  const deleteEntry = useCallback(
    async (path: string) => {
      await invoke("delete_entry", { path });
      await refreshFolder();

      for (const key of Object.keys(fileCacheRef.current)) {
        if (isWithin(key, path)) {
          delete fileCacheRef.current[key];
        }
      }

      if (isWithin(currentFileRef.current, path)) {
        setCurrentFile(UNTITLED_FILE);
        setValue(fileCacheRef.current[UNTITLED_FILE] || "");
      }
    },
    [refreshFolder]
  );

  return {
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
  };
}
