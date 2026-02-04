"use client";

import React, { useEffect, useState } from "react";
import { DecoratorNode, $getNodeByKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";

export class ImageNode extends DecoratorNode {
  __src;
  __alt;
  __caption;
  __publicId;
  __width;
  __height;

  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__alt,
      node.__caption,
      node.__publicId,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  constructor(
    src,
    alt = "",
    caption = "",
    publicId = "",
    width = 0,
    height = 0,
    key,
  ) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__caption = caption;
    this.__publicId = publicId;
    this.__width = width || 0;
    this.__height = height || 0;
  }

  createDOM() {
    const span = document.createElement("span");
    return span;
  }

  updateDOM() {
    return false;
  }

  exportJSON() {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      caption: this.__caption,
      publicId: this.__publicId,
      width: this.__width,
      height: this.__height,
    };
  }

  static importJSON(serializedNode) {
    const { src, alt, caption, publicId, width, height } = serializedNode;
    return $createImageNode({
      src,
      alt,
      caption,
      publicId,
      width,
      height,
    });
  }

  exportDOM() {
    const figure = document.createElement("figure");
    figure.setAttribute("data-lexical-image", "1");

    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__alt || "");
    img.setAttribute("loading", "lazy");
    if (this.__width) img.setAttribute("width", String(this.__width));
    if (this.__height) img.setAttribute("height", String(this.__height));
    if (this.__publicId) img.setAttribute("data-public-id", this.__publicId);

    figure.appendChild(img);

    if (this.__caption) {
      const fc = document.createElement("figcaption");
      fc.textContent = this.__caption;
      figure.appendChild(fc);
    }

    return { element: figure };
  }

  static importDOM() {
    return {
      figure: () => ({
        conversion: (domNode) => {
          const fig = domNode;
          const img = fig.querySelector("img");
          if (!img) return null;

          const src = img.getAttribute("src") || "";
          const alt = img.getAttribute("alt") || "";
          const publicId = img.getAttribute("data-public-id") || "";
          const width = Number(img.getAttribute("width") || 0) || 0;
          const height = Number(img.getAttribute("height") || 0) || 0;
          const fc = fig.querySelector("figcaption");
          const caption = fc ? fc.textContent || "" : "";

          return {
            node: $createImageNode({
              src,
              alt,
              caption,
              publicId,
              width,
              height,
            }),
          };
        },
        priority: 2,
      }),
      img: () => ({
        conversion: (domNode) => {
          const img = domNode;
          const src = img.getAttribute("src") || "";
          const alt = img.getAttribute("alt") || "";
          const publicId = img.getAttribute("data-public-id") || "";
          const width = Number(img.getAttribute("width") || 0) || 0;
          const height = Number(img.getAttribute("height") || 0) || 0;

          return {
            node: $createImageNode({
              src,
              alt,
              caption: "",
              publicId,
              width,
              height,
            }),
          };
        },
        priority: 1,
      }),
    };
  }

  setAlt(nextAlt) {
    const self = this.getWritable();
    self.__alt = String(nextAlt || "");
  }

  setCaption(nextCaption) {
    const self = this.getWritable();
    self.__caption = String(nextCaption || "");
  }

  decorate() {
    return (
      <ImageComponent
        nodeKey={this.getKey()}
        src={this.__src}
        alt={this.__alt}
        caption={this.__caption}
      />
    );
  }
}

function ImageComponent({ nodeKey, src, alt, caption }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const [altText, setAltText] = useState(alt || "");
  const [capText, setCapText] = useState(caption || "");

  useEffect(() => setAltText(alt || ""), [alt]);
  useEffect(() => setCapText(caption || ""), [caption]);

  function applyAlt(v) {
    setAltText(v);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof ImageNode) node.setAlt(v);
    });
  }

  function applyCaption(v) {
    setCapText(v);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof ImageNode) node.setCaption(v);
    });
  }

  function remove() {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
    clearSelection();
  }

  return (
    <div
      className={[
        "my-4 rounded-2xl border bg-white/5 p-3",
        isSelected ? "border-sky-400/70" : "border-white/10",
      ].join(" ")}
      contentEditable={false}
      onClick={(e) => {
        e.preventDefault();
        setSelected(!isSelected);
      }}
    >
      <img
        src={src}
        alt={altText}
        className="w-full max-h-[460px] object-contain rounded-xl bg-black/10"
        loading="lazy"
      />

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={altText}
          onChange={(e) => applyAlt(e.target.value)}
          placeholder="alt text (SEO)"
          className="h-9 rounded-xl bg-slate-950 px-3 text-xs text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
        />
        <input
          value={capText}
          onChange={(e) => applyCaption(e.target.value)}
          placeholder="caption"
          className="h-9 rounded-xl bg-slate-950 px-3 text-xs text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20 md:col-span-2"
        />
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={remove}
          className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/25"
        >
          Remove image
        </button>
      </div>
    </div>
  );
}

export function $createImageNode({
  src,
  alt = "",
  caption = "",
  publicId = "",
  width = 0,
  height = 0,
}) {
  return new ImageNode(src, alt, caption, publicId, width, height);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
