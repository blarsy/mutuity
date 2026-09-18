import React from "react";
import { Linking, StyleSheet, Text, TextStyle, View } from "react-native";
import { designTokens } from "../theme/tokens";

interface InlineHtmlProps {
  html: string;
  baseStyle?: TextStyle;
  emptyFallback?: string;
}

type InlineSegment = {
  text: string;
  strong?: boolean;
  emphasis?: boolean;
  href?: string;
};

type Block =
  | { kind: "paragraph"; segments: InlineSegment[] }
  | { kind: "list"; ordered: boolean; items: InlineSegment[][] };

// Lexes a limited inline/structural HTML subset into plain segments. Any tags not
// explicitly handled are stripped, keeping only their text content. This mirrors the
// web app's RichTextContent allowlist (p, br, h1-h6, strong, em, ul, ol, li, a) so the
// mobile public campaign page renders the same editor output without a WebView.
const VOID_TAGS = new Set(["br", "hr"]);
const BLOCK_CLOSE_TAGS = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul", "ol"]);

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function parseTagAttributes(raw: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;
  let match = pattern.exec(raw);
  while (match) {
    const key = match[1]?.toLowerCase();
    const value = match[2];
    if (key && value !== undefined) {
      attributes[key] = value;
    }
    match = pattern.exec(raw);
  }
  return attributes;
}

function splitBlocks(html: string): string {
  // Collapse <p>, <div> and heading tags into explicit paragraph delimiters we can
  // split on, and turn <li> into bullet markers. <br> becomes a literal newline.
  return html
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/(h1|h2|h3|h4|h5|h6)>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<(p|div|h1|h2|h3|h4|h5|h6)[^>]*>/gi, "")
    .replace(/<(li)[^>]*>/gi, "")
    .replace(/<[a-zA-Z][^>]*>/gi, "");
}

function parseInlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let buffer = "";
  let strong = false;
  let emphasis = false;
  let href: string | undefined;

  const flush = (): void => {
    if (buffer.length === 0) {
      return;
    }
    segments.push({ text: buffer, strong, emphasis, ...(href !== undefined ? { href } : {}) });
    buffer = "";
  };

  const tagPattern = /<\/?(strong|b|em|i|a|span|u|s|strike|del|sub|sup)\b[^>]*>/gi;
  let lastIndex = 0;
  let match = tagPattern.exec(text);

  while (match) {
    buffer += decodeEntities(text.slice(lastIndex, match.index));
    const fullTag = match[0];
    const tagName = (match[1] ?? "").toLowerCase();
    const isClosing = fullTag.startsWith("</");
    lastIndex = tagPattern.lastIndex;

    if (tagName === "strong" || tagName === "b") {
      strong = !isClosing;
    } else if (tagName === "em" || tagName === "i") {
      emphasis = !isClosing;
    } else if (tagName === "a") {
      if (isClosing) {
        href = undefined;
      } else {
        const attributes = parseTagAttributes(fullTag.slice(2, -1));
        href = attributes.href;
      }
    }
    // span, u, s, sub, sup are accepted but flattened to their text content.

    match = tagPattern.exec(text);
  }

  buffer += decodeEntities(text.slice(lastIndex));
  flush();

  return segments.filter((segment) => segment.text.trim().length > 0 || segment.text.includes("\u00a0"));
}

function renderInline(segments: InlineSegment[], baseStyle?: TextStyle): React.ReactNode {
  return segments.map((segment, index) => {
    const handlePress = segment.href
      ? () => {
          void Linking.openURL(segment.href as string).catch(() => undefined);
        }
      : undefined;

    return (
      <Text
        key={`${index}-${segment.text}`}
        onPress={handlePress}
        style={[
          baseStyle,
          segment.strong && styles.strong,
          segment.emphasis && styles.emphasis,
          segment.href && styles.link
        ]}
      >
        {segment.text}
      </Text>
    );
  });
}

function parseBlocks(html: string, baseStyle?: TextStyle): Block[] {
  const blocks: Block[] = [];
  const chunks = splitBlocks(html).split(/\n{2,}/);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (trimmed.length === 0) {
      continue;
    }

    // A single trailing newline inside a chunk came from <br>; keep it as one paragraph.
    const segments = parseInlineSegments(chunk.replace(/\n+/g, " ").trim());
    if (segments.length === 0) {
      continue;
    }

    blocks.push({ kind: "paragraph", segments });
  }

  return blocks;
}

function plainTextFromHtml(html: string): string {
  return decodeEntities(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function InlineHtml({ html, baseStyle, emptyFallback }: InlineHtmlProps): React.JSX.Element {
  const hasContent = plainTextFromHtml(html ?? "").length > 0;

  if (!hasContent) {
    return emptyFallback ? <Text style={[styles.fallback, baseStyle]}>{emptyFallback}</Text> : <></>;
  }

  const blocks = parseBlocks(html ?? "", baseStyle);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.kind === "paragraph") {
          return (
            <Text key={`p-${index}`} style={[styles.paragraph, baseStyle]}>
              {renderInline(block.segments, baseStyle)}
            </Text>
          );
        }

        return (
          <View key={`list-${index}`} style={styles.listContainer}>
            {block.items.map((item, itemIndex) => (
              <View key={`li-${itemIndex}`} style={styles.listItem}>
                <Text style={[styles.bullet, baseStyle]}>{block.ordered ? `${itemIndex + 1}.` : "\u2022"}</Text>
                <Text style={[styles.listItemText, baseStyle]}>{renderInline(item, baseStyle)}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4
  },
  paragraph: {
    lineHeight: 20
  },
  strong: {
    fontWeight: "700"
  },
  emphasis: {
    fontStyle: "italic"
  },
  link: {
    color: designTokens.colors.primary,
    textDecorationLine: "underline"
  },
  fallback: {
    color: designTokens.colors.secondary
  },
  listContainer: {
    gap: 2
  },
  listItem: {
    flexDirection: "row",
    gap: 6
  },
  bullet: {
    width: 14,
    textAlign: "right"
  },
  listItemText: {
    flex: 1,
    lineHeight: 20
  }
});