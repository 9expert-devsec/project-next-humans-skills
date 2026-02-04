"use client";

import React from "react";
import { DecoratorNode } from "lexical";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

function clean(x) {
  return String(x || "").trim();
}

function YouTubePreview({ url }) {
  const embed = url ? toYouTubeEmbedUrl(url) : "";
  if (!embed) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
        YouTube URL ไม่ถูกต้อง
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <div className="aspect-video">
        <iframe
          className="h-full w-full"
          src={embed}
          title="YouTube embed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export class YouTubeNode extends DecoratorNode {
  __url;

  static getType() {
    return "youtube";
  }

  static clone(node) {
    return new YouTubeNode(node.__url, node.__key);
  }

  constructor(url, key) {
    super(key);
    this.__url = clean(url);
  }

  setURL(url) {
    const writable = this.getWritable();
    writable.__url = clean(url);
  }

  getURL() {
    return this.__url;
  }

  createDOM() {
    const div = document.createElement("div");
    return div;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <YouTubePreview url={this.__url} />;
  }

  exportJSON() {
    return {
      type: "youtube",
      version: 1,
      url: this.__url,
    };
  }

  static importJSON(serialized) {
    return new YouTubeNode(serialized.url || "");
  }

  // ✅ ให้ $generateHtmlFromNodes สร้าง HTML ออกมาได้
  exportDOM() {
    const url = clean(this.__url);
    const embed = url ? toYouTubeEmbedUrl(url) : "";
    const wrap = document.createElement("div");
    wrap.setAttribute("data-lexical-youtube", url);

    // ทำเป็น responsive embed ด้วย inline style (ไม่ต้องพึ่ง CSS ภายนอก)
    wrap.setAttribute(
      "style",
      "position:relative;padding-top:56.25%;border:1px solid rgba(255,255,255,.10);border-radius:16px;overflow:hidden;background:rgba(0,0,0,.35);margin:16px 0;",
    );

    if (embed) {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("src", embed);
      iframe.setAttribute("title", "YouTube video");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      );
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute(
        "style",
        "position:absolute;inset:0;width:100%;height:100%;border:0;",
      );
      wrap.appendChild(iframe);
    } else {
      const p = document.createElement("div");
      p.innerText = "Invalid YouTube URL";
      p.setAttribute(
        "style",
        "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.70);font-size:14px;",
      );
      wrap.appendChild(p);
    }

    return { element: wrap };
  }
}

export function $createYouTubeNode(url) {
  return new YouTubeNode(url);
}

export function $isYouTubeNode(node) {
  return node instanceof YouTubeNode;
}
