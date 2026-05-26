import { Box, Container, List, ListItem, Typography } from "@mui/material";

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME || "Mutuity";

const TOKEN_IS_NOT = [
  "legal tender",
  "electronic money",
  "an official means of payment",
  "a financial instrument",
  "a purchasable voucher",
  "a claim to monetary compensation"
];

const TOKEN_PROPERTIES = [
  "cannot be exchanged for euros",
  "is not bought or sold against official currency",
  "is not pegged to labor time or a stable external index",
  "does not provide any conversion, refund, or guaranteed value"
];

export default function TermsPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Terms Of Use
        </Typography>

        <Typography gutterBottom variant="h6">
          1. Platform purpose
        </Typography>
        <Typography paragraph>
          {PRODUCT_NAME} is a collaborative exchange platform designed to support non-monetary
          interactions through an internal accounting unit named token.
        </Typography>

        <Typography gutterBottom variant="h6">
          2. Nature of token
        </Typography>
        <Typography paragraph>
          token is an internal unit used within {PRODUCT_NAME}. It is not:
        </Typography>
        <List dense>
          {TOKEN_IS_NOT.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>
        <Typography paragraph>
          token also:
        </Typography>
        <List dense>
          {TOKEN_PROPERTIES.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>

        <Typography gutterBottom variant="h6">
          3. Exchanges between users
        </Typography>
        <Typography paragraph>
          Exchanges are negotiated freely between participants, with no official pricing table.
          Users are solely responsible for legal, tax, and social obligations that may apply to
          their activity.
        </Typography>

        <Typography gutterBottom variant="h6">
          4. Platform endowment mechanism
        </Typography>
        <Typography paragraph>
          To support platform operation and development, a platform endowment equivalent to 10%
          of each validated exchange volume may be minted in token and assigned to a dedicated
          platform account.
        </Typography>

        <Typography gutterBottom variant="h6">
          5. Transparency and evolution
        </Typography>
        <Typography paragraph>
          {PRODUCT_NAME} communicates the core principles of token usage and may evolve the
          system over time to preserve legal compliance and product sustainability.
        </Typography>
      </Box>
    </Container>
  );
}
