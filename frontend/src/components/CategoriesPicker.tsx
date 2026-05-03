/**
 * CategoriesDialog — modal checkbox picker for resource categories.
 *
 * Usage pattern (like Tope-là's EditableChipList):
 *   - Selected categories are shown as deletable Chips
 *   - An "…" chip opens the dialog
 *   - The dialog shows all categories as checkboxes
 */
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface CategoryOption {
  code: number;
  label: string;
  labelFr: string;
}

// ── Dialog ────────────────────────────────────────────────────────────────────

interface CategoriesDialogProps {
  open: boolean;
  options: CategoryOption[];
  selected: number[];
  localizedLabel: (opt: CategoryOption) => string;
  onClose: () => void;
  onConfirm: (codes: number[]) => void;
}

function CategoriesDialogModal({
  open,
  options,
  selected,
  localizedLabel,
  onClose,
  onConfirm,
}: CategoriesDialogProps) {
  const { t } = useTranslation("resources");
  const [current, setCurrent] = useState<number[]>(selected);

  // Re-sync when dialog re-opens with different selected codes
  const handleOpen = () => setCurrent(selected);

  const toggle = (code: number, checked: boolean) => {
    setCurrent((prev) =>
      checked
        ? [...prev, code].sort((a, b) => a - b)
        : prev.filter((c) => c !== code)
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle>{t("categories.dialogTitle")}</DialogTitle>
      <DialogContent>
        <FormGroup>
          {options.map((opt) => (
            <FormControlLabel
              key={opt.code}
              control={
                <Checkbox
                  checked={current.includes(opt.code)}
                  onChange={(_, checked) => toggle(opt.code, checked)}
                  size="small"
                />
              }
              label={localizedLabel(opt)}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("categories.cancel")}</Button>
        <Button
          variant="contained"
          onClick={() => {
            onConfirm(current);
            onClose();
          }}
        >
          {t("categories.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Public composite component ────────────────────────────────────────────────

interface CategoriesPickerProps {
  options: CategoryOption[];
  selected: number[];
  localizedLabel: (opt: CategoryOption) => string;
  onChange: (codes: number[]) => void;
}

export function CategoriesPicker({
  options,
  selected,
  localizedLabel,
  onChange,
}: CategoriesPickerProps) {
  const { t } = useTranslation("resources");
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedOptions = options.filter((o) => selected.includes(o.code));

  return (
    <>
      <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
        {selectedOptions.map((opt) => (
          <Chip
            key={opt.code}
            label={localizedLabel(opt)}
            color="primary"
            size="small"
            onDelete={() =>
              onChange(selected.filter((c) => c !== opt.code))
            }
          />
        ))}
        <Chip
          label={selectedOptions.length === 0 ? t("categories.addButton") : "…"}
          color="primary"
          size="small"
          variant="outlined"
          onClick={() => setDialogOpen(true)}
        />
      </Stack>

      <CategoriesDialogModal
        open={dialogOpen}
        options={options}
        selected={selected}
        localizedLabel={localizedLabel}
        onClose={() => setDialogOpen(false)}
        onConfirm={onChange}
      />
    </>
  );
}
