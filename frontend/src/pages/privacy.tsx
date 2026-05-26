import { Box, Container, List, ListItem, Typography } from "@mui/material";

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME || "Mutuity";

const SHARING_CASES = [
  "If you explicitly consent.",
  "If sharing is required to provide a feature you requested.",
  "If disclosure is required by law or judicial process."
];

export default function PrivacyPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Privacy Policy
        </Typography>

        <Typography paragraph>
          We care about the confidentiality of your personal data. This policy explains how
          {` ${PRODUCT_NAME} `}
          collects, uses, and protects information when you use the platform.
        </Typography>

        <Typography gutterBottom variant="h6">
          1. Data we collect
        </Typography>
        <Typography paragraph>
          We only collect personal data required to operate the platform, such as your email
          address, display name, and the content you create while using
          {` ${PRODUCT_NAME}`}.
        </Typography>

        <Typography gutterBottom variant="h6">
          2. How we use your data
        </Typography>
        <Typography paragraph>
          We use personal data to provide requested services, including notifications,
          account management, and product experience personalization.
        </Typography>

        <Typography gutterBottom variant="h6">
          3. Data sharing
        </Typography>
        <Typography paragraph>
          We do not sell personal data. We only share data in the following situations:
        </Typography>
        <List dense>
          {SHARING_CASES.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>

        <Typography gutterBottom variant="h6">
          4. Security
        </Typography>
        <Typography paragraph>
          We apply reasonable technical and organizational measures to protect personal data
          against unauthorized access, disclosure, alteration, or destruction.
        </Typography>

        <Typography gutterBottom variant="h6">
          5. Data retention
        </Typography>
        <Typography paragraph>
          We retain data only as long as needed to provide services, unless a longer period is
          required or permitted by law.
        </Typography>

        <Typography gutterBottom variant="h6">
          6. Your rights
        </Typography>
        <Typography paragraph>
          Depending on applicable law, you may have rights to access, correct, delete, limit,
          or object to processing of your personal data, and to request portability.
        </Typography>

        <Typography gutterBottom variant="h6">
          7. Policy updates
        </Typography>
        <Typography paragraph>
          We may update this policy from time to time. Material changes will be posted on this
          page.
        </Typography>

        <Typography variant="body2">
          Contact: topela.tech@gmail.com
        </Typography>
      </Box>
    </Container>
  );
}
