import { Box, Container, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mutuity Frontend Bootstrap
        </Typography>
        <Typography>
          Phase 1 scaffold is ready. Campaign and need feature pages will be added in subsequent tasks.
        </Typography>
      </Box>
    </Container>
  );
}
