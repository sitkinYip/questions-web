export type ContentSegment =
  | { type: "text"; content: string }
  | { type: "highlight"; content: string }
  | {
      type: "link";
      content: string;
      href: string;
      target: "internal" | "external";
    }
  | { type: "image"; url: string }
  | { type: "video"; url: string; poster?: string }
  | { type: "break" };
