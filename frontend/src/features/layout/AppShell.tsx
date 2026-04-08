import { Box } from "@mui/material";
import type { ReactNode } from "react";

import { AppTopBar } from "./AppTopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppTopBar />
      <Box component="main">{children}</Box>
    </Box>
  );
}
