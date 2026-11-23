import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, FormHelperText, IconButton, Radio, RadioGroup, Stack, Typography
} from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

type CampaignOption = { id: string; title: string; startAt?: string };

interface CampaignPickerProps {
  name?: string;
  label: string;
  options: CampaignOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  allowEmpty?: boolean;
  disabled?: boolean;
  helperText?: string;
  compact?: boolean;
}

export function CampaignPicker({
  name, label, options, selected, onChange, multiple = false, allowEmpty = true, disabled, helperText, compact = false
}: CampaignPickerProps) {
  const { t } = useTranslation("campaigns");
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const sortedOptions = [...options].sort((a, b) => {
    const aStart = a.startAt ? Date.parse(a.startAt) : Number.POSITIVE_INFINITY;
    const bStart = b.startAt ? Date.parse(b.startAt) : Number.POSITIVE_INFINITY;
    const validAStart = Number.isNaN(aStart) ? Number.POSITIVE_INFINITY : aStart;
    const validBStart = Number.isNaN(bStart) ? Number.POSITIVE_INFINITY : bStart;
    return validAStart - validBStart;
  });
  const selectedTitles = sortedOptions.filter(option => selected.includes(option.id)).map(option => option.title);
  const emptyLabel = t(multiple ? "picker.allCampaigns" : "picker.noCampaign");

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>{label}</Typography>
      <Button
        name={name}
        type="button"
        variant="outlined"
        color="primary"
        fullWidth={!compact}
        endIcon={compact ? <FactCheckIcon /> : undefined}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={`${label}: ${selectedTitles.length ? selectedTitles.join(", ") : emptyLabel}`}
        sx={{ justifyContent: "flex-start", textAlign: "left" }}
        onClick={() => { setDraft(selected); setOpen(true); }}
      >
        {selectedTitles.length ? selectedTitles.join(", ") : emptyLabel}
      </Button>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={titleId} fullWidth maxWidth="sm">
        <DialogTitle id={titleId}>{t("picker.title")}</DialogTitle>
        <DialogContent dividers>
          <Box component={multiple ? "div" : RadioGroup} {...(!multiple ? {
            name: `${titleId}-campaign`, value: draft[0] ?? "", onChange: (_event: React.ChangeEvent<HTMLInputElement>, value: string) => setDraft(value ? [value] : [])
          } : {})}>
            {!multiple && allowEmpty ? (
              <FormControlLabel
                value=""
                control={<Radio />}
                label={emptyLabel}
              />
            ) : null}
            {sortedOptions.map(campaign => (
              <Stack key={campaign.id} direction="row" alignItems="center" justifyContent="space-between">
                <FormControlLabel
                  sx={{ flex: 1, minWidth: 0 }}
                  value={campaign.id}
                  control={multiple ? (
                    <Checkbox checked={draft.includes(campaign.id)} onChange={(_, checked) => {
                      setDraft(current => checked ? [...current, campaign.id] : current.filter(id => id !== campaign.id));
                    }} />
                  ) : (
                    <Radio />
                  )}
                  label={campaign.title}
                />
                <IconButton
                  component="a"
                  href={`/campaigns/${encodeURIComponent(campaign.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  aria-label={t("picker.openCampaign", { title: campaign.title })}
                  title={t("picker.openCampaign", { title: campaign.title })}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            {options.length === 0 ? <Typography color="text.secondary">{t("picker.empty")}</Typography> : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("picker.cancel")}</Button>
          <Button variant="contained" onClick={() => { onChange(draft); setOpen(false); }}>{t("picker.confirm")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}