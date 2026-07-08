const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "strong",
  "u",
  "ul",
]);

const TAG_ALIASES: Record<string, string> = {
  b: "strong",
  i: "em",
};

const DROP_TAGS = new Set(["script", "style", "iframe", "object", "embed", "svg", "math"]);

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return true;
  return false;
}

function plainTextToHtml(input: string) {
  const escaped = escapeHtml(input);
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((part) => part.replace(/\n/g, "<br>"))
    .map((part) => `<p>${part}</p>`)
    .join("");

  return paragraphs || "";
}

function hasHtmlMarkup(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

function sanitizeWithDomParser(input: string) {
  const template = document.createElement("template");
  template.innerHTML = input;

  const output = document.createElement("div");

  const appendSanitized = (source: Node, target: HTMLElement) => {
    if (source.nodeType === Node.TEXT_NODE) {
      const text = source.textContent ?? "";
      const parts = text.split(/\n/);

      parts.forEach((part, index) => {
        if (part) {
          target.appendChild(document.createTextNode(part));
        }
        if (index < parts.length - 1) {
          target.appendChild(document.createElement("br"));
        }
      });
      return;
    }

    if (source.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = source as HTMLElement;
    const rawTag = element.tagName.toLowerCase();
    const tag = TAG_ALIASES[rawTag] ?? rawTag;

    if (DROP_TAGS.has(tag)) {
      return;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      for (const child of Array.from(element.childNodes)) {
        appendSanitized(child, target);
      }
      return;
    }

    if (tag === "br" || tag === "hr") {
      target.appendChild(document.createElement(tag));
      return;
    }

    const cleanElement = document.createElement(tag);

    if (tag === "a") {
      const href = element.getAttribute("href") ?? "";
      if (isSafeUrl(href)) {
        cleanElement.setAttribute("href", href.trim());
      }

      const targetAttr = element.getAttribute("target");
      if (targetAttr) {
        cleanElement.setAttribute("target", targetAttr);
        if (targetAttr === "_blank") {
          cleanElement.setAttribute("rel", "noopener noreferrer");
        }
      }

      const title = element.getAttribute("title");
      if (title) {
        cleanElement.setAttribute("title", title);
      }
    }

    for (const child of Array.from(element.childNodes)) {
      appendSanitized(child, cleanElement);
    }

    target.appendChild(cleanElement);
  };

  for (const child of Array.from(template.content.childNodes)) {
    appendSanitized(child, output);
  }

  return output.innerHTML;
}

function sanitizeFallback(input: string) {
  const stripped = input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\sstyle\s*=\s*"[^"]*"/gi, "")
    .replace(/\sstyle\s*=\s*'[^']*'/gi, "")
    .replace(/\s(?:href|src)\s*=\s*"javascript:[^"]*"/gi, "")
    .replace(/\s(?:href|src)\s*=\s*'javascript:[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");

  if (!hasHtmlMarkup(stripped)) {
    return plainTextToHtml(stripped);
  }

  return stripped;
}

export function richTextToHtml(input: string | null | undefined) {
  const source = String(input ?? "");
  if (!source.trim()) return "";

  if (!hasHtmlMarkup(source)) {
    return plainTextToHtml(source);
  }

  if (typeof document !== "undefined" && typeof DOMParser !== "undefined") {
    return sanitizeWithDomParser(source);
  }

  return sanitizeFallback(source);
}

export function richTextToPlainText(input: string | null | undefined) {
  const source = String(input ?? "");
  if (!source.trim()) return "";

  return source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[2-4]|li|blockquote|pre|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
