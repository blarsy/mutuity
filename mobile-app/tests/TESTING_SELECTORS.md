# Testing Selectors Policy

All mobile acceptance and E2E tests must use semantic selectors only.

Allowed selectors:
- `getByRole`
- `getByLabelText` or `getByLabel`
- `getByPlaceholderText` or `getByPlaceholder`
- `getByTestId` only when a semantic selector is not available

Disallowed selectors:
- Text-node traversal
- Internal component props
- Snapshot assertions as the only signal for interactive flows

## Helper Policy

Use `selectorPolicy.ts` helpers for:
- standardizing role-based access
- providing consistent test IDs when required
- documenting selector fallback decisions

If a screen cannot be covered semantically, update the UI contract first rather than bypassing the policy.
