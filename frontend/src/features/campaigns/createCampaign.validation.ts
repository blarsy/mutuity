import * as Yup from "yup";

export type CreateCampaignValues = {
  title: string;
  theme: string;
  managerNoteFromCreator: string;
  rewardsMultiplier: number;
  airdropAmount: number;
  startAt: string;
  airdropAt: string;
  endAt: string;
};

export const createCampaignInitialValues: CreateCampaignValues = {
  title: "",
  theme: "",
  managerNoteFromCreator: "",
  rewardsMultiplier: 5,
  airdropAmount: 3000,
  startAt: "",
  airdropAt: "",
  endAt: ""
};

export const createCampaignValidationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  theme: Yup.string().trim().required("Theme is required"),
  managerNoteFromCreator: Yup.string().optional(),
  rewardsMultiplier: Yup.number().integer().min(5).max(10).required(),
  airdropAmount: Yup.number().integer().min(3000).max(8000).required(),
  startAt: Yup.string().required("Start date is required"),
  airdropAt: Yup.string().required("Airdrop date is required"),
  endAt: Yup.string().required("End date is required")
}).test("chronological-dates", "Dates must be chronologically valid", value => {
  if (!value?.startAt || !value.airdropAt || !value.endAt) {
    return true;
  }

  const start = new Date(value.startAt).getTime();
  const airdrop = new Date(value.airdropAt).getTime();
  const end = new Date(value.endAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(airdrop) || Number.isNaN(end)) {
    return false;
  }

  return start < end && airdrop >= start && airdrop <= end;
});
