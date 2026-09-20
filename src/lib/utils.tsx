import { File, FileCode2, FileJson, FileText } from "lucide-react";

export function FileIcon({ name }: { name: string }) {
  const extension = name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return <FileCode2 className="h-4 w-4 text-blue-400" />;

    case "json":
      return <FileJson className="h-4 w-4 text-yellow-400" />;

    case "md":
    case "txt":
      return <FileText className="h-4 w-4 text-zinc-400" />;

    default:
      return <File className="h-4 w-4 text-zinc-500" />;
  }
}
