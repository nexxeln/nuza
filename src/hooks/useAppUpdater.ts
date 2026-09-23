import { useCallback, useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/** Checks for and installs app updates via the Tauri updater plugin. */
export function useAppUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(null));
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      setIsUpdating(true);
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        await relaunch();
      } else {
        console.log("No updates available");
      }
    } catch (error) {
      console.error("Failed to update:", error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { isUpdating, checkForUpdates, version };
}
