import { renderToStaticMarkup } from "react-dom/server";
import { Children, isValidElement, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import EditNeedPage from "../../src/features/needs/CreateNeedPage";
import CreateResourcePage from "../../src/features/resources/CreateResourcePage";
import { CampaignListingFeedback } from "../../src/features/campaigns/CampaignListingFeedback";
import type { CampaignListingRelation } from "../../src/features/campaigns/campaignListingLifecycle";
import { NEED_EDIT_DETAIL_QUERY } from "../../src/features/needs/needs.queries";
import { RESOURCE_EDIT_DETAIL_QUERY } from "../../src/features/resources/resources.queries";

let mockKind: "need" | "resource" = "need";
const mockPush = jest.fn();
let mockForm: { initialValues: Record<string, unknown>; onSubmit: Function; children: Function };

jest.mock("next/router", () => ({ useRouter: () => ({ isReady: true, query: { [`${mockKind}Id`]: "listing" }, push: mockPush }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string, values?: { date?: string }) => values?.date ? `${key}: ${values.date}` : key, i18n: { language: "en" } }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: jest.fn() }));
jest.mock("formik", () => ({ Formik: (props: typeof mockForm) => { mockForm = props; return null; }, Form: () => null }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: { account: { id: "owner" } } }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({ useRequireAuth: () => ({ isAuthenticated: true }) }));
jest.mock("../../src/components/ImageUploadField", () => ({ ImageUploadField: () => null }));
jest.mock("../../src/components/richText/RichTextEditor", () => ({ RichTextEditor: () => null }));
jest.mock("../../src/components/LocationPicker", () => ({ LocationPicker: () => null }));

const relation: CampaignListingRelation = {
  campaignId: "campaign-a", submissionId: "submission-a", status: "REJECTED", isCurrent: false,
  submittedAt: new Date().toISOString(), actedAt: "2026-11-15T10:30:00Z", rejectionNote: "Please add details",
  campaignByCampaignId: { title: "Campaign A", startAt: "2020-01-01", endAt: "2099-01-01" }
};
const listing = {
  id: "listing", title: "Listing", description: "Details", location: "Brussels", latitude: null, longitude: null,
  intensity: "SHARING", proposedTopesAmount: 100, defaultTokenAmount: 100, imageUrls: [], expiresAt: null,
  objectRequired: true, competenceRequired: false, toolingRequired: false, multiplePeopleRequired: false,
  requiredCompetenceText: null, requiredToolingText: null, requiredPeopleCount: null,
  isProduct: true, isService: false, canBeGiven: true, canBeExchanged: false, canBeTakenAway: true, canBeDelivered: false,
  resourceCategoryAssignmentsByResourceId: { nodes: [] },
  campaignNeedsByNeedId: { nodes: [relation] }, campaignResourcesByResourceId: { nodes: [relation] }
};

describe("campaign listing feedback dates", () => {
  const submittedAt = "2026-11-10T09:00:00Z";
  const actedAt = "2026-11-15T10:30:00Z";
  it.each([
    ["PENDING", "submittedAt", submittedAt],
    ["REJECTED", "rejectedAt", actedAt],
    ["ACCEPTED", "acceptedAt", actedAt],
    ["SUPERSEDED", "submittedAt", submittedAt]
  ] as const)("shows only the %s status date", (status, key, expected) => {
    const html = renderToStaticMarkup(<CampaignListingFeedback relation={{ ...relation, status, submittedAt, actedAt }} locked={false} />);
    expect(html).toContain(`listingLifecycle.${key}: ${new Date(expected).toLocaleString("en")}`);
    for (const other of ["submittedAt", "rejectedAt", "acceptedAt"].filter(value => value !== key)) {
      expect(html).not.toContain(`listingLifecycle.${other}`);
    }
    expect(html).not.toContain("listingLifecycle.campaignDates");
    expect(html).not.toContain(new Date(relation.campaignByCampaignId!.startAt).toLocaleString("en"));
    expect(html).not.toContain(new Date(relation.campaignByCampaignId!.endAt).toLocaleString("en"));
  });
  it.each(["ACCEPTED", "REJECTED"] as const)("does not substitute the submission date for a missing %s decision date", status => {
    const html = renderToStaticMarkup(<CampaignListingFeedback relation={{ ...relation, status, submittedAt, actedAt: null }} locked={false} />);
    expect(html).not.toContain("listingLifecycle.submittedAt");
    expect(html).not.toContain("listingLifecycle.acceptedAt");
    expect(html).not.toContain("listingLifecycle.rejectedAt");
  });
});

describe.each(["need", "resource"] as const)("%s editor campaign writes", kind => {
  let mutations: Record<string, jest.Mock>;
  let relations: CampaignListingRelation[];
  const renderEditor = () => renderToStaticMarkup(kind === "need" ? <EditNeedPage /> : <CreateResourcePage />);
  const helpers = () => ({ setStatus: jest.fn(), setSubmitting: jest.fn() });
  function controls(values = mockForm.initialValues, submitForm = jest.fn()) {
    const elements: { type: unknown; props: Record<string, any> }[] = [];
    function collect(nodes: ReactNode) {
      Children.forEach(nodes, node => {
        if (!isValidElement<Record<string, any>>(node)) return;
        elements.push(node);
        collect(node.props.children);
      });
    }
    collect(mockForm.children({ values, errors: {}, touched: {}, setFieldValue: jest.fn(), setFieldTouched: jest.fn(), submitForm }));
    return elements;
  }
  beforeEach(() => {
    mockKind = kind;
    relations = [relation];
    mockPush.mockReset().mockResolvedValue(true);
    mutations = {};
    jest.mocked(useMutation).mockImplementation(document => {
      const name = document.definitions.find(definition => definition.kind === "OperationDefinition");
      const operation = name?.kind === "OperationDefinition" ? name.name!.value : "unknown";
      const mutate = jest.fn().mockResolvedValue({ data: { publishResource: { resource: { id: "listing" } } } });
      mutations[operation] = mutate;
      return [mutate, { loading: false }] as unknown as ReturnType<typeof useMutation>;
    });
    jest.mocked(useQuery).mockImplementation(() => ({
      data: { needById: { ...listing, campaignNeedsByNeedId: { nodes: relations } },
        resourceById: { ...listing, campaignResourcesByResourceId: { nodes: relations } }, allCampaigns: { nodes: [] } }, loading: false
    }) as unknown as ReturnType<typeof useQuery>);
    renderEditor();
  });

  it("keeps rejected feedback selected without resubmitting when saving edits", async () => {
    expect(mockForm.initialValues.campaignId).toBe("campaign-a");
    await mockForm.onSubmit(mockForm.initialValues, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mutations[kind === "need" ? "UpdateNeed" : "PublishResource"]).toHaveBeenCalledTimes(1);
    expect(mutations[kind === "need" ? "CreateCampaignNeedLink" : "CreateCampaignResourceLink"]).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(`/${kind}s/manage`);
  });

  it("switches by linking directly, with no unlink operation", async () => {
    await mockForm.onSubmit({ ...mockForm.initialValues, campaignId: "campaign-b" }, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mutations[kind === "need" ? "CreateCampaignNeedLink" : "CreateCampaignResourceLink"]).toHaveBeenCalledWith({
      variables: { campaignId: "campaign-b", [`${kind}Id`]: "listing" }
    });
    expect(Object.keys(mutations).some(name => /Delete|Unlink/.test(name))).toBe(false);
  });

  it("explicitly resubmits the rejected listing to the same campaign through the form button", async () => {
    const submitForm = jest.fn(() => mockForm.onSubmit(mockForm.initialValues, helpers()));
    const resubmit = controls(undefined, submitForm).find(node => node.props.children === "listingLifecycle.resubmit");
    expect(resubmit?.props.type).toBe("button");
    expect(resubmit?.props.sx).toEqual({ alignSelf: "flex-start" });
    await resubmit!.props.onClick();
    expect(submitForm).toHaveBeenCalledTimes(1);
    expect(mutations[kind === "need" ? "CreateCampaignNeedLink" : "CreateCampaignResourceLink"]).toHaveBeenCalledWith({
      variables: { campaignId: "campaign-a", [`${kind}Id`]: "listing" }
    });
  });

  it("shows rejection feedback and its decision time in the editor", () => {
    const feedback = controls().find(node => node.type === CampaignListingFeedback);
    expect(feedback?.props.relation).toEqual(relation);
    const html = renderToStaticMarkup(<CampaignListingFeedback relation={feedback!.props.relation} locked={false} />);
    expect(html).toContain(`listingLifecycle.rejectedAt: ${new Date(relation.actedAt!).toLocaleString("en")}`);
    expect(html).toContain("listingLifecycle.feedbackLabel");
    expect(html).toContain("Please add details");
    const query = kind === "need" ? NEED_EDIT_DETAIL_QUERY : RESOURCE_EDIT_DETAIL_QUERY;
    expect(query.loc?.source.body).toMatch(/\bactedAt\b/);
  });

  it("does not invent a rejection date or display an empty note", () => {
    const html = renderToStaticMarkup(<CampaignListingFeedback relation={{ ...relation, actedAt: null, rejectionNote: "  " }} locked={false} />);
    expect(html).not.toContain("listingLifecycle.rejectedAt");
    expect(html).not.toContain("listingLifecycle.feedbackLabel");
  });

  it("escapes rejection notes", () => {
    const html = renderToStaticMarkup(<CampaignListingFeedback relation={{ ...relation, rejectionNote: "<script>bad</script>" }} locked={false} />);
    expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("does not leak resubmit intent into Save after form validation prevents submission", async () => {
    const resubmit = controls(undefined, jest.fn().mockResolvedValue(undefined)).find(node => node.props.children === "listingLifecycle.resubmit");
    await resubmit!.props.onClick();
    await mockForm.onSubmit(mockForm.initialValues, helpers());
    expect(mutations[kind === "need" ? "CreateCampaignNeedLink" : "CreateCampaignResourceLink"]).not.toHaveBeenCalled();
  });

  it.each(["ACCEPTED", "PENDING"] as const)("locks the %s campaign and offers no clearing option", status => {
    relations = [{ ...relation, status, isCurrent: true }];
    renderEditor();
    const elements = controls();
    const picker = elements.find(node => node.props.name === "campaignId");
    if (kind === "need") expect(picker?.props.disabled).toBe(true);
    else expect(picker).toBeUndefined();
    expect(elements.some(node => node.props.children === "form.noCampaign")).toBe(false);
    expect(elements.some(node => node.props.children === "listingLifecycle.resubmit")).toBe(false);
  });

  it("allows replacing a 24h pending campaign but not clearing it", () => {
    relations = [{ ...relation, status: "PENDING", isCurrent: true, submittedAt: new Date(Date.now() - 24 * 3_600_000).toISOString() }];
    renderEditor();
    const elements = controls();
    expect(elements.find(node => node.props.name === "campaignId")!.props.disabled).toBeFalsy();
    expect(elements.some(node => node.props.children === "form.noCampaign")).toBe(false);
  });

  it("releases an ended accepted campaign for a new submission", async () => {
    relations = [{ ...relation, status: "ACCEPTED", isCurrent: true,
      campaignByCampaignId: { ...relation.campaignByCampaignId!, endAt: "2020-01-02" } }];
    renderEditor();
    expect(mockForm.initialValues.campaignId).toBe("");
    const elements = controls();
    expect(elements.find(node => node.props.name === "campaignId")!.props.disabled).toBeFalsy();
    expect(elements.some(node => node.props.children === "form.noCampaign")).toBe(true);
    await mockForm.onSubmit({ ...mockForm.initialValues, campaignId: "campaign-b" }, helpers());
    expect(mutations[kind === "need" ? "CreateCampaignNeedLink" : "CreateCampaignResourceLink"]).toHaveBeenCalledWith({
      variables: { campaignId: "campaign-b", [`${kind}Id`]: "listing" }
    });
  });

  it("does not navigate on a stale submission error, and Save never retries that resubmission", async () => {
    const link = mutations[kind === "need" ? "CreateCampaignNeedLink" : "CreateCampaignResourceLink"]!;
    link.mockRejectedValueOnce(new CombinedGraphQLErrors({ errors: [{ message: "Submission is no longer current" }] }));
    const formHelpers = helpers();
    const resubmit = controls(undefined, jest.fn(() => mockForm.onSubmit(mockForm.initialValues, formHelpers)))
      .find(node => node.props.children === "listingLifecycle.resubmit");
    await resubmit!.props.onClick();
    expect(formHelpers.setStatus).toHaveBeenLastCalledWith("Submission is no longer current");
    expect(mockPush).not.toHaveBeenCalled();
    await mockForm.onSubmit(mockForm.initialValues, helpers());
    expect(link).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(`/${kind}s/manage`);
  });
});