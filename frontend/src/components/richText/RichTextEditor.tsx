import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Box,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Tooltip,
  Typography
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
};

const EMPTY_DOC = "<p></p>";

export function RichTextEditor({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  minHeight = 180
}: RichTextEditorProps) {
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing..."
      })
    ],
    content: value || EMPTY_DOC,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "campaign-rich-text-editor"
      }
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const normalizedValue = value || EMPTY_DOC;

    if (editor.getHTML() !== normalizedValue) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const headingValue = !editor
    ? "paragraph"
    : editor.isActive("heading", { level: 1 })
      ? "h1"
      : editor.isActive("heading", { level: 2 })
        ? "h2"
        : editor.isActive("heading", { level: 3 })
          ? "h3"
          : editor.isActive("heading", { level: 4 })
            ? "h4"
            : editor.isActive("heading", { level: 5 })
              ? "h5"
              : editor.isActive("heading", { level: 6 })
                ? "h6"
                : "paragraph";

  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "🥹", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😍", "🥰", "😘", "😗", "😋", "😛", "😜",
    "🤪", "🤩", "😎", "🤓", "🧐", "🤔", "🤨", "😐", "😑", "😶",
    "🙄", "😏", "😮", "😳", "🥺", "😢", "😭", "😤", "😡", "🤯",
    "😱", "😬", "😅", "😴", "🤗", "🫶", "🙌", "👏", "👍", "👎",
    "👌", "✌️", "🤞", "🙏", "💪", "👀", "👋", "🎉", "🎊", "🔥",
    "✨", "⭐", "🌟", "💯", "✅", "❌", "⚠️", "❗", "❓", "❤️",
    "🩷", "🧡", "💛", "💚", "🩵", "💙", "💜", "🖤", "🤍", "🤎",
    "💔", "💕", "💖", "💘", "💬", "💭", "📌", "📝", "📅", "📎",
    "🔗", "📣", "🚀", "🎯", "💡", "📷", "🎵", "🍀", "☀️", "🌈",
    "😈", "👿", "🤠", "🥳", "🤤", "🥴", "🫠", "🫥", "🫨", "🫡",
    "🤐", "🤫", "🤭", "🫢", "😌", "😔", "😪", "🤒", "🤕", "🤢",
    "🤮", "🥶", "🥵", "😷", "🤧", "🤠", "😵", "😵‍💫", "🤥", "😬",
    "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "🧓", "👴", "👵",
    "🙋", "🙋‍♀️", "🙋‍♂️", "🙆", "🙆‍♀️", "🙆‍♂️", "🙅", "🙅‍♀️", "🙅‍♂️", "🤷",
    "🤷‍♀️", "🤷‍♂️", "🤦", "🤦‍♀️", "🤦‍♂️", "🙎", "🙍", "💁", "🧏", "🫱",
    "🫲", "👉", "👈", "☝️", "👇", "👆", "🖐️", "✋", "🖖", "🤙",
    "🫳", "🫴", "🤝", "🫸", "🫷", "✍️", "💅", "👂", "👃", "🧠",
    "🫀", "🫁", "🦷", "🦴", "👣", "👤", "👥", "🗣️", "👑", "🎩",
    "👒", "🧢", "🪖", "⛑️", "👓", "🕶️", "🥽", "🥼", "🧥", "👔",
    "👕", "👖", "🧣", "🧤", "🧦", "👗", "👘", "🥻", "🩱", "🩲",
    "🩳", "👙", "👚", "👛", "👜", "👝", "🎒", "👞", "👟", "🥾",
    "🥿", "👠", "👡", "👢", "💍", "💎", "🪄", "🧸", "🎮", "🎲",
    "🧩", "♟️", "🎯", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈",
    "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳",
    "🎣", "🤿", "🛹", "🛼", "🛷", "⛸️", "🎿", "🏂", "🪂", "🚴",
    "🚴‍♀️", "🚴‍♂️", "🏃", "🏃‍♀️", "🏃‍♂️", "🧘", "🧘‍♀️", "🧘‍♂️", "💃", "🕺",
    "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻",
    "📱", "☎️", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💾", "🧮", "📺",
    "📻", "🕰️", "⏰", "⏱️", "⏳", "📡", "🔋", "🔌", "💡", "🔦",
    "🕯️", "🧯", "🛒", "🧳", "🗂️", "📂", "📁", "🗃️", "🗄️", "🗑️",
    "🧾", "💰", "💵", "💶", "💷", "💴", "💳", "🪙", "💸", "📈",
    "📉", "📊", "🛠️", "🔧", "🔨", "⚙️", "🪛", "🪚", "🧰", "🔒",
    "🔓", "🔐", "🗝️", "🔑", "🌍", "🌎", "🌏", "🌕", "🌖", "🌗",
    "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🪐", "☁️", "⛅", "🌤️",
    "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "☔", "💨", "🌪️",
    "🌫️", "🌊", "🌱", "🌿", "🌵", "🌲", "🌳", "🌴", "🌺", "🌸",
    "🌼", "🌻", "🌹", "🪻", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇",
    "🍓", "🫐", "🍒", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦",
    "🥕", "🌽", "🥔", "🧄", "🧅", "🍞", "🥐", "🥖", "🧀", "🍳",
    "🥓", "🍔", "🍟", "🍕", "🌭", "🌮", "🌯", "🥗", "🍝", "🍜",
    "🍣", "🍤", "🍦", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫", "🍿",
    "🥤", "🧋", "☕", "🍵", "🍺", "🍷", "🥂", "🍸", "🍹", "🧊"
  ];

  const handleHeadingChange = (nextValue: string) => {
    if (!editor) {
      return;
    }

    if (nextValue === "paragraph") {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = Number(nextValue.replace("h", ""));

    if (level >= 1 && level <= 6) {
      editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    }
  };

  const insertEmoji = (emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run();
    setEmojiAnchorEl(null);
  };

  return (
    <Box>
      <Typography sx={{ mb: 0.75 }} variant="body2">
        {label}
      </Typography>

      <Paper sx={{ mb: 1.25, p: 1 }} variant="outlined">
        <Stack alignItems="center" direction="row" spacing={0.5}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="rte-heading-label">Style</InputLabel>
            <Select
              label="Style"
              labelId="rte-heading-label"
              onChange={event => {
                handleHeadingChange(event.target.value);
              }}
              value={headingValue}
            >
              <MenuItem value="paragraph">Body</MenuItem>
              <MenuItem value="h1">Heading 1</MenuItem>
              <MenuItem value="h2">Heading 2</MenuItem>
              <MenuItem value="h3">Heading 3</MenuItem>
              <MenuItem value="h4">Heading 4</MenuItem>
              <MenuItem value="h5">Heading 5</MenuItem>
              <MenuItem value="h6">Heading 6</MenuItem>
            </Select>
          </FormControl>

          <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />

          <Tooltip title="Bold">
            <IconButton
              color={editor?.isActive("bold") ? "primary" : "default"}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              size="small"
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Italic">
            <IconButton
              color={editor?.isActive("italic") ? "primary" : "default"}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              size="small"
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Bulleted list">
            <IconButton
              color={editor?.isActive("bulletList") ? "primary" : "default"}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              size="small"
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Numbered list">
            <IconButton
              color={editor?.isActive("orderedList") ? "primary" : "default"}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              size="small"
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Insert or edit link">
            <IconButton
              color={editor?.isActive("link") ? "primary" : "default"}
              onClick={setLink}
              size="small"
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Insert emoji">
            <IconButton
              color={emojiAnchorEl ? "primary" : "default"}
              onClick={event => {
                setEmojiAnchorEl(event.currentTarget);
              }}
              size="small"
            >
              <EmojiEmotionsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Popover
        anchorEl={emojiAnchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        onClose={() => {
          setEmojiAnchorEl(null);
        }}
        open={Boolean(emojiAnchorEl)}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 1.25, width: 320 }}>
          <Typography sx={{ mb: 1 }} variant="caption">
            Select an emoji
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 0.5, maxHeight: 300, overflowY: "auto" }}>
            {emojis.map((emoji, index) => (
              <IconButton
                key={`${emoji}-${index}`}
                onClick={() => {
                  insertEmoji(emoji);
                }}
                size="small"
              >
                <span>{emoji}</span>
              </IconButton>
            ))}
          </Box>
        </Box>
      </Popover>

      <Box
        onBlur={onBlur}
        sx={theme => ({
          border: 1,
          borderColor: error ? theme.palette.error.main : theme.palette.divider,
          borderRadius: 1,
          px: 1.5,
          py: 1,
          "& .campaign-rich-text-editor": {
            minHeight,
            outline: "none",
            ...theme.typography.body1,
            lineHeight: 1.7
          },
          "& .campaign-rich-text-editor p": {
            my: 1
          },
          "& .campaign-rich-text-editor h1": {
            ...theme.typography.h3,
            my: 1.5
          },
          "& .campaign-rich-text-editor h2": {
            ...theme.typography.h4,
            my: 1.25
          },
          "& .campaign-rich-text-editor h3": {
            ...theme.typography.h5,
            my: 1.2
          },
          "& .campaign-rich-text-editor h4": {
            ...theme.typography.h6,
            my: 1.1
          },
          "& .campaign-rich-text-editor h5": {
            ...theme.typography.subtitle1,
            my: 1
          },
          "& .campaign-rich-text-editor h6": {
            ...theme.typography.subtitle2,
            my: 1
          },
          "& .campaign-rich-text-editor a": {
            color: theme.palette.primary.main,
            textDecoration: "underline"
          },
          "& .campaign-rich-text-editor ul, & .campaign-rich-text-editor ol": {
            pl: 3
          },
          "& .campaign-rich-text-editor .is-editor-empty:first-of-type::before": {
            color: theme.palette.text.disabled,
            content: "attr(data-placeholder)",
            float: "left",
            height: 0,
            pointerEvents: "none"
          }
        })}
      >
        <EditorContent editor={editor} />
      </Box>

      {helperText ? <FormHelperText error={error}>{helperText}</FormHelperText> : null}
    </Box>
  );
}
