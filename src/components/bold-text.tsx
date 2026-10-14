import type { ReactNode } from "react";

/** Render paired bold tags and safe links; other markup stays escaped text. */
export function BoldText({ text }: { text: string }) {
  const root: ReactNode[] = [];
  const stack: { tag: string; opening: string; href?: string; children: ReactNode[] }[] = [];
  const append = (node: ReactNode) => (stack.at(-1)?.children ?? root).push(node);

  for (const [index, token] of text.split(/(<\/?(?:b|strong)>|<a\s+href\s*=\s*(?:"[^"]*"|'[^']*')(?:\s+(?:target|rel)\s*=\s*(?:"[^"]*"|'[^']*'))*\s*>|<\/a>)/gi).entries()) {
    const tag = /^<(\/?)(b|strong|a)(?:\s+href\s*=\s*(?:"([^"]*)"|'([^']*)')(?:\s+(?:target|rel)\s*=\s*(?:"[^"]*"|'[^']*'))*\s*)?>$/i.exec(token);
    if (!tag) {
      append(token);
    } else if (!tag[1]) {
      const name = tag[2].toLowerCase();
      const href = name === "a" ? safeHref(tag[3] ?? tag[4] ?? "") : undefined;
      stack.push({ tag: name, opening: token, href: stack.some((frame) => frame.tag === "a") ? undefined : href, children: [] });
    } else if (stack.at(-1)?.tag === tag[2].toLowerCase()) {
      const frame = stack.pop()!;
      if (frame.tag === "a") {
        if (frame.href) {
          append(<a key={index} href={frame.href} target="_blank" rel="noopener noreferrer ugc nofollow" className="text-[color:var(--report-bold,var(--acc))] underline underline-offset-4 hover:opacity-80">{frame.children}</a>);
        } else {
          append(frame.opening);
          frame.children.forEach(append);
          append(token);
        }
      } else {
        append(<strong key={index} className="font-bold text-[color:var(--report-bold,var(--acc))]">{frame.children}</strong>);
      }
    } else {
      append(token);
    }
  }

  // An unfinished tag remains visible rather than making the rest bold.
  while (stack.length) {
    const frame = stack.pop()!;
    append(frame.opening);
    frame.children.forEach(append);
  }

  return <>{root}</>;
}

function safeHref(value: string): string | undefined {
  const href = value.replace(/&amp;/gi, "&").trim();
  if (!/^https?:\/\//i.test(href)) return undefined;
  try {
    const url = new URL(href);
    return ["https:", "http:"].includes(url.protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}
