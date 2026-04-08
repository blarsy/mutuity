import NextLink from "next/link";
import { Avatar, IconButton, type IconButtonProps } from "@mui/material";

type AvatarIconButtonProps = Omit<IconButtonProps, "children" | "size"> & {
  displayName?: string | null;
  imageUrl?: string | null;
  href?: string;
  size?: number;
};

function getInitials(displayName?: string | null) {
  const trimmed = displayName?.trim();

  if (!trimmed) {
    return "?";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function AvatarIconButton({
  displayName,
  imageUrl,
  href,
  size = 32,
  sx,
  ...iconButtonProps
}: AvatarIconButtonProps) {
  const content = (
    <Avatar
      alt={displayName ?? "Account avatar"}
      src={imageUrl ?? undefined}
      sx={{
        width: size,
        height: size,
        fontSize: Math.max(12, size * 0.38)
      }}
    >
      {getInitials(displayName)}
    </Avatar>
  );

  if (href) {
    return (
      <IconButton
        aria-label={iconButtonProps["aria-label"] ?? displayName ?? "Open account"}
        component={NextLink}
        href={href}
        size="small"
        sx={{ p: 0, ...sx }}
        {...iconButtonProps}
      >
        {content}
      </IconButton>
    );
  }

  return (
    <IconButton
      aria-label={iconButtonProps["aria-label"] ?? displayName ?? "Open account"}
      size="small"
      sx={{ p: 0, ...sx }}
      {...iconButtonProps}
    >
      {content}
    </IconButton>
  );
}
