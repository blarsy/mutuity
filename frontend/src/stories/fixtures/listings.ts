export const MOCK_CREATOR_ACCOUNT_ID = "55555555-5555-4555-8555-555555555555";
export const MOCK_NEED_ID = "66666666-6666-4666-8666-666666666666";
export const MOCK_ACCOUNT_ID = "77777777-7777-4777-8777-777777777777";
export const MOCK_CAMPAIGN_ID = "88888888-8888-4888-8888-888888888888";

const creator = {
  id: MOCK_CREATOR_ACCOUNT_ID,
  displayName: "Atelier du Faubourg",
  externalSubject: "atelier@example.org"
};

export const mockNeedDetail = {
  id: MOCK_NEED_ID,
  creatorAccountId: MOCK_CREATOR_ACCOUNT_ID,
  title: "Coup de main pour un déménagement",
  description: "Deux heures de portage le samedi matin, un monte-charge est disponible.",
  location: "Tournai",
  intensity: "SHARING",
  proposedTopesAmount: 250,
  imageUrls: [],
  expiresAt: "2026-06-30T12:00:00.000Z",
  isActive: true,
  accountByCreatorAccountId: creator
};

export const mockCampaignDetail = {
  id: MOCK_CAMPAIGN_ID,
  creatorAccountId: MOCK_CREATOR_ACCOUNT_ID,
  title: "Quartier Solidaire",
  description: "<p>Une campagne d'entraide de quartier sur trois mois.</p>",
  theme: "NEIGHBOURHOOD",
  moderationStatus: "APPROVED",
  imageUrl: null,
  startAt: "2026-04-01T08:00:00.000Z",
  airdropAt: "2026-05-01T08:00:00.000Z",
  endAt: "2026-07-01T08:00:00.000Z",
  accountByCreatorAccountId: creator
};

export const mockCampaignFormattedDates = {
  startAt: "1 avril 2026",
  airdropAt: "1 mai 2026",
  endAt: "1 juillet 2026"
};

export const mockAccountDetail = {
  id: MOCK_ACCOUNT_ID,
  displayName: "Camille Dupont",
  externalSubject: "camille@example.org",
  bio: "Bricoleuse, jardinière et voisine disponible le week-end.",
  location: "Mons",
  latitude: 50.4542,
  longitude: 3.9523,
  avatarUrl: null,
  profileLinks: [{ type: "website", url: "https://example.org" }]
};

export const mockAccountNeeds = [
  { id: MOCK_NEED_ID, title: "Coup de main pour un déménagement" },
  { id: "99999999-9999-4999-8999-999999999999", title: "Prêt d'une remorque" }
];

export const mockAccountResources = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "Perceuse à colonne",
    description: "Disponible en semaine, sur rendez-vous.",
    location: "Mons",
    imageUrls: [],
    expiresAt: null,
    intensity: "SHARING",
    defaultTokenAmount: 80,
    isProduct: true,
    isService: false,
    canBeGiven: false,
    canBeExchanged: true,
    canBeTakenAway: true,
    canBeDelivered: false
  }
];
