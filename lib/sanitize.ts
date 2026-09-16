import DOMPurify from "isomorphic-dompurify";

/**
 * Strict HTML sanitizer configuration.
 * Only allows tags/attributes that the RichTextEditor (Tiptap) can produce.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "u",
    "a",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

/**
 * Sanitizes untrusted HTML using a strict allowlist of tags and attributes.
 * Automatically adds `rel="noopener noreferrer"` to all `<a>` tags
 * to prevent tabnabbing attacks on external links.
 */
export function sanitizeHtml(dirty: string): string {
  // Add a hook to force rel="noopener noreferrer" on every <a> tag
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("rel", "noopener noreferrer");
      node.setAttribute("target", "_blank");
    }
  });

  const clean = DOMPurify.sanitize(dirty, SANITIZE_CONFIG);

  // Remove the hook after use to avoid stacking duplicate hooks
  DOMPurify.removeHook("afterSanitizeAttributes");

  return clean as string;
}
