import re
import os

file_path = "PublicResourcesPage.tsx"
if not os.path.exists(file_path):
    print(f"Error: {file_path} not found")
    exit(1)

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add Dialog imports if missing
if 'Dialog,' not in content:
    import_match = re.search(r'import\s+\{[\s\S]*?\}\s+from\s+["\']@mui/material["\'];', content)
    if import_match:
        imports_block = import_match.group(0)
        if 'Container' in imports_block:
             new_imports = imports_block.replace(
                'Container,',
                'Container,\n  Dialog,\n  DialogActions,\n  DialogContent,\n  DialogTitle,'
            )
             content = content.replace(imports_block, new_imports)
             print("✓ Added Dialog imports")

# 2. Find and remove the old/duplicate proximity section
# Using a simpler pattern to avoid potential regex issues with complex nesting
pattern = r'\s+<Box>\s+<Typography gutterBottom variant="subtitle2">\s+\{t\("bropattern = r'\s+<Box>\s+<TypogrDistanceKm.+?</Box>'
mamamamamamamamamamamamamamamamamamamantent, re.DOTALL))
if len(matches) > 1:
    for match in reversed(matches[1:]):
        cont        cont        cont   )] +         cont    d():]
                                  es)                        y sections")
else:
    print(f"Found {len(matches)} proximity sections. No duplicates removed.")

# 3. Ensure Dialog component is rendered
if 'Dialog fullWidth maxWidth="if 'Dialog fullWidth maxWidth="if 'Dial (if 'Dialog fullWidth maxWidth="if 'Dialog ful       <Dialog fullWidth maxWidth="sm" onClose={() => setLocationDialogOpen(false)} open={locationDialogOpen}>
          <DialogTitle>{t("bro          <DialogTitle>{t("bro          <DialogTitle>{t("bro     ogContent>
            <LocationPicker
              addressLabel={t("browse.referenceLocationInputLabel")}              addressLabel={t("browse.referenceLocationInputLabel")}                         addressLabel={t("browse.referenceLocationInputLabel")}              addressLabel={t("browse.referenceLocationInpuetLo              addressLabel={t("browse.referenceLocat"common" })}</Button>
            <Button
              onClick={() => {
                setExplicitLocation({
                  lat                  lat                  lat                  lat         t.longitude,
                  source: "explicit"
                });
                s                s                nDraft.address);
                setLocationDialogOpen(false);
              }}
              variant="contained"
            >
              {t("actions.save", { ns: "common" })}
            </Button>
          </DialogActions>
                                                                                                                ? (')
        print("✓ Added Dialog component")

with open(file_path, 'w') as f:
    f.write(content)

print("✓ File cleanup completed successfully")
