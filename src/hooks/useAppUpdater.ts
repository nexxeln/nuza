import { useCallback, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";

/** Checks for and installs app updates via the Tauri updater plugin. */
export function useAppUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdates = useCallback(async () => {
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

  return { isUpdating, checkForUpdates };
}
