import type { ReactNode } from "react";

/** Render only paired bold tags; all other markup stays escaped text. */
export function BoldText({ text }: { text: string }) {
  const root: ReactNode[] = [];
  const stack: { tag: string; opening: string; children: ReactNode[] }[] = [];
  const append = (node: ReactNode) => (stack.at(-1)?.children ?? root).push(node);

  for (const [index, token] of text.split(/(<\/?(?:b|strong)>)/gi).entries()) {
    const tag = /^<(\/?)(b|strong)>$/i.exec(token);
    if (!tag) {
      append(token);
    } else if (!tag[1]) {
      stack.push({ tag: tag[2].toLowerCase(), opening: token, children: [] });
    } else if (stack.at(-1)?.tag === tag[2].toLowerCase()) {
      const frame = stack.pop()!;
      append(<strong key={index} className="font-bold">{frame.children}</strong>);
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
