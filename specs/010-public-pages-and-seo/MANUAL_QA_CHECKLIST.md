# Manual QA Checklist: Public Pages & SEO

## Desktop Testing

### Need Detail Page (/needs/[needId])
- [ ] Load as guest, verify:
  - Page displays need title, description, location
  - "Sign In to Contact" button is visible
  - Clicking button redirects to /login?next=%2Fneeds%2F[id]
  - No console errors
  - Metadata tags present in HTML (og:title, og:description, canonical)
  
- [ ] Log in as non-owner, verify:
  - "Contact Creator" button replaces login button
  - Click button opens conversation dialog
  - Can send initial message
  - No console errors
  
- [ ] Log in as need owner, verify:
  - No CTA button is visible
  - Still shows full need details
  - No console errors

### Campaign Detail Page (/campaigns/[campaignId])
- [ ] Load as guest, verify:
  - Page displays campaign title, description, theme content
  - Schedule (start, airdrop, end dates) visible
  - No "Contact Creator" button or similar CTA
  - Dates formatted correctly (not locale-specific mismatch)
  - Metadata tags present in HTML
  - No console errors
  
- [ ] Log in as any user, verify:
  - Still no CTA button
  - Campaign details unchanged
  - No console errors

### Account Detail Page (/accounts/[accountId])
- [ ] Load as guest, verify:
  - Page displays account name, bio, location, avatar
  - Lists needs and resources (if any)
  - No "Contact" or "Message" button
  - Metadata tags present in HTML
  - No console errors
  
- [ ] Log in as non-owner, verify:
  - Still no CTA button
  - Account details unchanged
  - No console errors
  
- [ ] Log in as account owner, verify:
  - Can see own profile
  - Own account shows own data (not anonymized)
  - No console errors

## Deleted Account Scenarios

### After Account Deletion (/accounts/[deletedAccountId])
- [ ] Load account page, verify:
  - Shows "Account Not Available" or similar message
  - Displays VISIBLE_DELETED state chip
  - No email, phone, location, or bio visible
  - Account ID preserved in URL
  - No console errors

### Need with Deleted Creator (/needs/[needId])
- [ ] If creator deleted, verify:
  - Need page still loads
  - Creator name shows as "Anonymous" or deleted indicator
  - No deleted creator email visible
  - Creator link goes to deleted account page
  - No console errors

### Campaign with Deleted Creator (/campaigns/[campaignId])
- [ ] If creator deleted, verify:
  - Campaign page still loads
  - Creator info anonymized
  - No deleted creator email visible
  - Creator link goes to deleted account page
  - No console errors

## Mobile Testing (< 768px)

### Need Detail Page
- [ ] Button layout responsive (not cramped)
- [ ] Date/time display readable
- [ ] Text flows correctly without horizontal scroll
- [ ] Conversation dialog usable on mobile

### Campaign Detail Page
- [ ] Schedule timeline readable
- [ ] Rich text content renders properly
- [ ] No layout shifts
- [ ] Touch targets adequate (> 48px)

### Account Detail Page
- [ ] Avatar displays correctly
- [ ] Needs/resources list scrollable
- [ ] Info layout doesn't overflow
- [ ] Links are easily tappable

## SEO & Metadata

### All Public Pages
- [ ] og:title tag present and descriptive
- [ ] og:description tag present and unique
- [ ] canonical link present and correct
- [ ] meta description present
- [ ] No duplicate metadata across pages
- [ ] For deleted accounts: metadata is generic (no PII)

### Structured Data
- [ ] JSON-LD schema present (schema.org)
- [ ] Person/CreativeWork types correct
- [ ] No email in schema (if public page)
- [ ] Can be parsed by SEO crawlers

## Performance Baseline

### Page Load Times (with cache headers)
- [ ] Need detail page: < 2s (first contentful paint)
- [ ] Campaign detail page: < 2s
- [ ] Account detail page: < 2s

### Hydration
- [ ] No hydration warnings in console for any page
- [ ] Campaign dates don't show locale mismatch after client hydration
- [ ] Interactive elements respond immediately after load

## Accessibility

### Keyboard Navigation
- [ ] All buttons/links reachable via Tab
- [ ] CTA buttons can be activated with Enter/Space
- [ ] Dialog can be closed with Escape
- [ ] Focus order is logical

### Screen Reader
- [ ] Page title announced
- [ ] Headings form proper hierarchy
- [ ] Images have alt text (or aria-hidden if decorative)
- [ ] Buttons/links have descriptive labels
- [ ] Deleted state clearly announced
- [ ] Form fields in conversation dialog labeled

### Color Contrast
- [ ] All text meets WCAG AA standards (4.5:1 for body, 3:1 for large)
- [ ] State chips (VISIBLE_ACTIVE, etc.) readable
- [ ] Links distinguishable (not color-only)

## Browser Compatibility

- [ ] Chrome (latest): All pages load, buttons work, no errors
- [ ] Firefox (latest): All pages load, buttons work, no errors
- [ ] Safari (latest): All pages load, buttons work, no errors, dates format correctly
- [ ] Edge (latest): All pages load, buttons work, no errors

## Localization (i18n)

### French Mode (if available)
- [ ] Need page labels in French
- [ ] Campaign page labels in French
- [ ] Account page labels in French
- [ ] Dates formatted according to French locale preference
- [ ] No label overflows in French

### English Mode
- [ ] All labels present in English
- [ ] Consistent terminology across pages

## Error States

### Not Found Cases
- [ ] Invalid need ID: Shows "Not Found" message
- [ ] Invalid campaign ID: Shows "Not Found" message  
- [ ] Invalid account ID: Shows "Not Found" message
- [ ] 404 response is correct HTTP status

### Restricted/Hidden Cases
- [ ] Private need (if applicable): Shows "Unavailable" message
- [ ] Deactivated need: Shows appropriate state
- [ ] Suspended account: Shows "Unavailable" message

## Security Spot Checks

- [ ] No authentication tokens in URL (only /login?next=...)
- [ ] No PII in HTML source code
- [ ] No email addresses in page metadata
- [ ] No phone numbers visible anywhere
- [ ] HTTPS enforced (no http://)
- [ ] CSP headers allow only intended resources

## Sign-In Flow Integration

### Guest CTA Flow
- [ ] Click "Sign In to Contact" on need page
- [ ] Redirected to /login?next=%2Fneeds%2F[id]
- [ ] Log in successfully
- [ ] Return to need page after login
- [ ] Can now see conversation button instead of sign-in button

### Authenticated CTA Flow
- [ ] Click "Contact Creator" on need page
- [ ] Dialog opens (don't send anything)
- [ ] Close dialog with Escape or X button
- [ ] Can click button again to reopen
- [ ] Send test message
- [ ] Message sent successfully
- [ ] Conversation created or added to

## Summary

- Total checks: ~80
- All checks passed: ✅ Ready for Feature 10 completion
- Some checks failed: ⚠️ Log issues for next iteration

**Test Date:** __________
**Tester:** __________
**Environment:** staging / production
**Notes:** 
