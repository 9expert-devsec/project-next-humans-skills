"use client";

import { useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import styles from "./LexicalEditorClient.module.css";

import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  ListItemNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, TOGGLE_LINK_COMMAND, $createLinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import {
  TableNode,
  TableCellNode,
  TableRowNode,
  INSERT_TABLE_COMMAND,
} from "@lexical/table";

import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  $insertNodes,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";

import { $generateHtmlFromNodes } from "@lexical/html";

import ImagesPlugin, { INSERT_IMAGE_COMMAND } from "./plugins/ImagesPlugin";
import { ImageNode } from "./nodes/ImageNode";

import YouTubePlugin, { INSERT_YOUTUBE_COMMAND } from "./plugins/YouTubePlugin";
import { YouTubeNode } from "./nodes/YouTubeNode";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function Placeholder() {
  return (
    <div className="pointer-events-none absolute top-3 left-3 text-sm text-slate-400">
      เริ่มเขียนบทความได้เลย…
    </div>
  );
}

/** ✅ ทำ slug รองรับภาษาไทยด้วย (unicode letters/numbers) */
function slugifyLite(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** ✅ สร้าง TOC จาก HTML จริง + ใส่ id ให้ heading ใน html */
function buildTocAndInjectIds(rawHtml, max = 30) {
  const html = String(rawHtml || "");
  if (!html) return { html: "", toc: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const headings = Array.from(doc.body.querySelectorAll("h1, h2, h3, h4"));
  const used = new Set();
  const toc = [];

  for (const h of headings) {
    if (toc.length >= max) break;

    const text = String(h.textContent || "").trim();
    if (!text) continue;

    const level = Number(String(h.tagName || "").replace("H", "")) || 2;

    let id = String(h.getAttribute("id") || "").trim();
    if (!id) {
      const base = slugifyLite(text) || `section-${toc.length + 1}`;
      let uniq = base;
      let n = 1;

      while (used.has(uniq) || doc.getElementById(uniq)) {
        n += 1;
        uniq = `${base}-${n}`;
      }

      id = uniq;
      h.setAttribute("id", id);
    }

    used.add(id);
    toc.push({ id, text, level });
  }

  return { html: doc.body.innerHTML, toc };
}

function clean(x) {
  return String(x || "").trim();
}

/* -------------------- Toolbar -------------------- */

function Toolbar({ onAddAttachment }) {
  const [editor] = useLexicalComposerContext();
  const imgRef = useRef(null);
  const fileRef = useRef(null);

  const [link, setLink] = useState("");

  const [ytOpen, setYtOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState("");

  function format(cmd, payload) {
    editor.dispatchCommand(cmd, payload);
  }

  function setHeading(tag) {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  }

  function setQuote() {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }

  function toggleLink() {
    const href = link.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, href || null);
  }

  async function uploadImage(file) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/uploads/image", {
      method: "POST",
      body: fd,
    });
    const j = await res.json();
    if (!j?.ok) throw new Error(j?.error || "Upload failed");
    return j.asset; // {url, publicId, width, height}
  }

  async function uploadAnyFile(file) {
    const fd = new FormData();
    fd.append("file", file);

    const qs = new URLSearchParams();
    qs.set("kind", "file");
    qs.set("folder", "articles");

    const res = await fetch(`/api/admin/uploads/file?${qs.toString()}`, {
      method: "POST",
      body: fd,
    });
    const j = await res.json();
    if (!j?.ok) throw new Error(j?.error || "Upload failed");
    return j.asset; // {url, publicId, bytes, mime, name}
  }

  async function onPickImage(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    try {
      const asset = await uploadImage(f);
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: asset.url,
        alt: "",
        caption: "",
        publicId: asset.publicId,
        width: asset.width || 0,
        height: asset.height || 0,
      });
    } catch (err) {
      alert(err?.message || "Upload error");
    }
  }

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    try {
      const asset = await uploadAnyFile(f);

      // ✅ insert download link into editor at cursor
      editor.update(() => {
        const url = clean(asset.url);
        const name = clean(asset.name) || clean(f.name) || "Download file";
        const linkNode = $createLinkNode(url);
        linkNode.append($createTextNode(name));
        $insertNodes([linkNode, $createTextNode("\n")]);
      });

      // ✅ optional: sync to "Downloads panel" via callback
      onAddAttachment?.(asset);
    } catch (err) {
      alert(err?.message || "Upload error");
    }
  }

  function insertYouTube(url) {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, url);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-2">
        <button
          type="button"
          onClick={() => format(FORMAT_TEXT_COMMAND, "bold")}
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => format(FORMAT_TEXT_COMMAND, "italic")}
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => setHeading("h2")}
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => setHeading("h3")}
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          H3
        </button>
        <button
          type="button"
          onClick={setQuote}
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          Quote
        </button>

        <span className="mx-1 h-4 w-px bg-white/10" />

        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          Unlist
        </button>

        <span className="mx-1 h-4 w-px bg-white/10" />

        <button
          type="button"
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => new CodeNode());
              }
            });
          }}
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          Code block
        </button>
        <button
          type="button"
          onClick={() =>
            editor.dispatchCommand(INSERT_TABLE_COMMAND, {
              columns: 3,
              rows: 3,
            })
          }
          className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          Table 3x3
        </button>

        <span className="mx-1 h-4 w-px bg-white/10" />

        {/* ✅ YouTube embed block */}
        <button
          type="button"
          onClick={() => {
            setYtUrl(link.trim());
            setYtOpen(true);
          }}
          className="rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-white/15"
          title="Insert YouTube at cursor"
        >
          YouTube
        </button>

        <span className="mx-1 h-4 w-px bg-white/10" />

        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          onChange={onPickImage}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          className="rounded-lg bg-sky-400/15 px-2 py-1 text-xs font-medium text-sky-200 hover:bg-sky-400/25"
        >
          Upload image
        </button>

        {/* ✅ Upload file (download link) */}
        <input
          ref={fileRef}
          type="file"
          onChange={onPickFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-white/15"
        >
          Upload file
        </button>

        <span className="mx-1 h-4 w-px bg-white/10" />

        {/* Link input */}
        <div className="flex items-center gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="h-8 w-[220px] rounded-lg bg-white/5 px-2 text-xs text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={toggleLink}
            className="rounded-lg px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            Toggle Link
          </button>
        </div>
      </div>

      {/* ✅ YouTube modal */}
      {ytOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div className="text-sm font-medium text-slate-100">
                Insert YouTube
              </div>
              <button
                type="button"
                onClick={() => setYtOpen(false)}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-100 hover:bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-xs text-slate-400">
                วางลิงก์ YouTube (watch / shorts / youtu.be) แล้วกด Insert
              </div>
              <input
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-11 w-full rounded-xl bg-white/5 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setYtOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    insertYouTube(ytUrl);
                    setYtOpen(false);
                    setYtUrl("");
                  }}
                  className="rounded-xl bg-sky-400/90 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* -------------------- Editor -------------------- */

export default function LexicalEditorClient({
  initialJson = null,
  onChangePayload,
  onAddAttachment, // ✅ optional
}) {
  const initialConfig = useMemo(
    () => ({
      namespace: "ArticleEditor",
      theme: {},
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        CodeNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        ImageNode,
        YouTubeNode, // ✅ new
      ],
      editorState:
        initialJson && typeof initialJson === "object"
          ? JSON.stringify(initialJson)
          : null,
      onError(error) {
        console.error(error);
      },
    }),
    [initialJson],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={cx(
          "lexical-article-editor rounded-2xl border border-white/10 bg-slate-950 overflow-hidden",
          styles.root,
        )}
      >
        <Toolbar onAddAttachment={onAddAttachment} />

        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[520px] w-full p-6 outline-none text-slate-100 leading-7" />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        <HistoryPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <LinkPlugin />
        <TablePlugin />
        <ImagesPlugin />
        <YouTubePlugin />

        {/* ✅ table styles ใน editor */}
        <style jsx global>{`
          .lexical-article-editor table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          .lexical-article-editor th,
          .lexical-article-editor td {
            border: 1px solid rgba(255, 255, 255, 0.14);
            padding: 10px 12px;
            vertical-align: top;
          }
          .lexical-article-editor thead th {
            background: rgba(255, 255, 255, 0.06);
            font-weight: 600;
          }
          .lexical-article-editor blockquote {
            border-left: 3px solid rgba(255, 255, 255, 0.18);
            padding-left: 12px;
            color: rgba(255, 255, 255, 0.8);
            margin: 12px 0;
          }
          .lexical-article-editor pre {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            padding: 12px;
            border-radius: 14px;
            overflow: auto;
          }
        `}</style>

        <OnChangePlugin
          onChange={(editorState, editor) => {
            editorState.read(() => {
              const json = editorState.toJSON();
              const text = $getRoot().getTextContent();

              const rawHtml = $generateHtmlFromNodes(editor, null);
              const { html, toc } = buildTocAndInjectIds(rawHtml, 30);

              onChangePayload?.({ json, text, html, toc });
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}
