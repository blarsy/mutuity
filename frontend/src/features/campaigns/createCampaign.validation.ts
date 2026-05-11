import * as Yup from "yup";

function plainTextFromRichText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type CreateCampaignValues = {
  title: string;
  theme: string;
  imageUrls: string[];
  managerNoteFromCreator: string;
  rewardsMultiplier: number;
  airdropAmount: number;
  startAt: string;
  airdropAt: string;
  endAt: string;
};

function formatDatetimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildDefaultCampaignDates() {
  const now = new Date();

  const startAt = new Date(now);
  startAt.setDate(startAt.getDate() + 4);
  startAt.setHours(8, 0, 0, 0);

  const airdropAt = new Date(now);
  airdropAt.setDate(airdropAt.getDate() + 14);
  airdropAt.setHours(8, 0, 0, 0);

  const endAt = new Date(now);
  endAt.setDate(endAt.getDate() + 24);
  endAt.setHours(8, 0, 0, 0);

  return {
    startAt: formatDatetimeLocal(startAt),
    airdropAt: formatDatetimeLocal(airdropAt),
    endAt: formatDatetimeLocal(endAt)
  };
}

const defaultCampaignDates = buildDefaultCampaignDates();

export const createCampaignInitialValues: CreateCampaignValues = {
  title: "",
  theme: "",
  imageUrls: [],
  managerNoteFromCreator: "",
  rewardsMultiplier: 5,
  airdropAmount: 3000,
  startAt: defaultCampaignDates.startAt,
  airdropAt: defaultCampaignDates.airdropAt,
  endAt: defaultCampaignDates.endAt
};

export const createCampaignValidationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  theme: Yup.string()
    .required("Theme is required")
    .test("non-empty-rich-text", "Theme is required", value => plainTextFromRichText(value ?? "").length > 0),
  imageUrls: Yup.array().of(Yup.string().url()).default([]),
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
