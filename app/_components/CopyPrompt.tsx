"use client";

import { useState } from "react";

type Props = {
  text: string;
  title?: string;
  description?: string;
  customizeLink?: boolean;
};

export function CopyPrompt({ text, title, description, customizeLink = false }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
          {title}
        </p>
      )}
      {description && (
        <p className={`text-xs text-neutral-600 ${title ? "mt-1" : ""}`}>{description}</p>
      )}
      <pre
        className={`overflow-x-auto whitespace-pre-wrap rounded-xl bg-black p-5 text-sm leading-relaxed text-neutral-200 ${
          title || description ? "mt-3" : ""
        }`}
      >
        {text}
      </pre>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={handleCopy}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
            copied
              ? "bg-emerald-700 text-white"
              : "border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          }`}
        >
          {copied ? "Copied!" : "Copy prompt"}
        </button>
        {customizeLink && (
          <a
            href="/prompt-builder"
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Customize in Prompt Builder →
          </a>
        )}
      </div>
    </div>
  );
}
