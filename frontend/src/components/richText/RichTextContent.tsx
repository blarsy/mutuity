import DOMPurify from "isomorphic-dompurify";
import { Box, Typography } from "@mui/material";

type RichTextContentProps = {
  html: string;
  emptyFallback?: string;
};

function normalizeRichText(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "a"
    ],
    ALLOWED_ATTR: ["href", "target", "rel"]
  });
}

function plainTextFromHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function RichTextContent({ html, emptyFallback }: RichTextContentProps) {
  const sanitized = normalizeRichText(html || "");
  const hasContent = plainTextFromHtml(sanitized).length > 0;

  if (!hasContent) {
    return emptyFallback ? <Typography color="text.secondary">{emptyFallback}</Typography> : null;
  }

  return (
    <Box
      sx={theme => ({
        ...theme.typography.body1,
        lineHeight: 1.7,
        "& p": {
          my: 1
        },
        "& h1": {
          ...theme.typography.h3,
          my: 1.5
        },
        "& h2": {
          ...theme.typography.h4,
          my: 1.25
        },
        "& h3": {
          ...theme.typography.h5,
          my: 1.2
        },
        "& h4": {
          ...theme.typography.h6,
          my: 1.1
        },
        "& h5": {
          ...theme.typography.subtitle1,
          my: 1
        },
        "& h6": {
          ...theme.typography.subtitle2,
          my: 1
        },
        "& a": {
          color: theme.palette.primary.main,
          textDecoration: "underline"
        },
        "& ul, & ol": {
          pl: 3
        }
      })}
    >
      <Box dangerouslySetInnerHTML={{ __html: sanitized }} />
    </Box>
  );
}
