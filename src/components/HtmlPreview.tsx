interface HtmlPreviewProps {
  code: string;
}

/**
 * Renders raw HTML in a sandboxed iframe via `srcdoc`. Scripts and styles run
 * in isolation from the app (no same-origin access), so HTML/CSS/JS demos work
 * exactly as written.
 */
export default function HtmlPreview({ code }: HtmlPreviewProps) {
  return (
    <iframe
      className="html-frame"
      title="HTML preview"
      sandbox="allow-scripts allow-modals allow-popups allow-forms"
      srcDoc={code}
    />
  );
}
