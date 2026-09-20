import { FileEntry } from "./types";

export var fakeData: FileEntry[] = [
  {
    name: "src",
    path: "/src",
    isDirectory: true,
    children: [
      {
        name: "index.tsx",
        path: "/src/index.tsx",
        isDirectory: false,
      },
      {
        name: "App.tsx",
        path: "/src/App.tsx",
        isDirectory: false,
      },
    ],
  },
  {
    name: "public",
    path: "/public",
    isDirectory: true,
    children: [
      {
        name: "index.html",
        path: "/public/index.html",
        isDirectory: false,
      },
    ],
  },
];
