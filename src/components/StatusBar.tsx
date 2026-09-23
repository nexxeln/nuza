interface StatusBarProps {
  vimEnabled: boolean;
  mode: string;
  currentFile: string;
  timestamp: string;
}

/** Background/text color for each Vim mode indicator, keyed by CodeMirror's mode name. */
const VIM_MODE_STYLES: Record<string, string> = {
  insert: "bg-[#96FF96] text-black",
  normal: "bg-[#9696FF] text-black",
  visual: "bg-[#FFFF96] text-black",
};

/** The bottom bar: current Vim mode on the left, file name and last-edited time on the right. */
export default function StatusBar({ vimEnabled, mode, currentFile, timestamp }: StatusBarProps) {
  const modeStyle = vimEnabled ? VIM_MODE_STYLES[mode] : undefined;
  const fileName = currentFile.split(/[/\\]/).pop() || "untitled.md";

  return (
    <div className="bg-[#1E1E1E] flex items-center justify-between font-bold font-mono shrink-0 h-7 relative z-10">
      <span className={`text-xs uppercase px-4 h-full flex items-center w-fit ${modeStyle ?? ""}`}>
        {modeStyle ? `--${mode}--` : ""}
      </span>
      <span className="font-light text-xs text-gray-400 flex items-center gap-2 h-full">
        {fileName}
        <span className="text-xs font-medium uppercase px-4 h-full flex items-center bg-[#FF9696] text-black w-fit ml-2">
          {timestamp}
        </span>
      </span>
    </div>
  );
}
