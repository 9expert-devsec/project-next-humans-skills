"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_EDITOR, createCommand, $insertNodes } from "lexical";
import { $createYouTubeNode } from "../nodes/YouTubeNode";

export const INSERT_YOUTUBE_COMMAND = createCommand("INSERT_YOUTUBE_COMMAND");

function clean(x) {
  return String(x || "").trim();
}

export default function YouTubePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const url = clean(payload);
        editor.update(() => {
          $insertNodes([$createYouTubeNode(url)]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
