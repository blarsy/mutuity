import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useMutation, useQuery } from "@apollo/client/react";
import CreateResourcePage from "../../src/features/resources/CreateResourcePage";
import { LocationPicker } from "../../src/components/LocationPicker";
import { ACCOUNT_PROFILE_QUERY } from "../../src/features/profile/profile.queries";
import { RESOURCE_EDIT_DETAIL_QUERY } from "../../src/features/resources/resources.queries";
import { createResourceInitialValues, createResourceValidationSchema } from "../../src/features/resources/createResource.validation";

type FormProps = {
  initialValues: Record<string, unknown>;
  validationSchema: typeof createResourceValidationSchema;
  onSubmit: (values: Record<string, unknown>, helpers: { setStatus: jest.Mock; setSubmitting: jest.Mock }) => Promise<void>;
  children: (props: Record<string, unknown>) => ReactNode;
};

let mockForm: FormProps | undefined;
let mockResourceId: string | undefined;
let mockRouterReady = true;
const mockPublish = jest.fn();
const mockPush = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ isReady: mockRouterReady, query: mockResourceId ? { resourceId: mockResourceId } : {}, push: mockPush }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: jest.fn() }));
jest.mock("formik", () => ({ Formik: (props: FormProps) => { mockForm = props; return null; }, Form: () => null }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: { account: { id: "owner" } } }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({ useRequireAuth: () => ({ isAuthenticated: true }) }));
jest.mock("../../src/components/ImageUploadField", () => ({ ImageUploadField: () => null }));
jest.mock("../../src/components/richText/RichTextEditor", () => ({ RichTextEditor: () => null }));
jest.mock("../../src/components/LocationPicker", () => ({ LocationPicker: () => null }));

const resource = {
  id: "listing", title: "Resource", description: "", imageUrls: [],
  location: "Resource address", latitude: 50.6, longitude: 3.4,
  intensity: "SHARING", defaultTokenAmount: null, expiresAt: null,
  isProduct: true, isService: false, canBeGiven: true, canBeExchanged: false,
  canBeTakenAway: true, canBeDelivered: false,
  resourceCategoryAssignmentsByResourceId: { nodes: [] },
  campaignResourcesByResourceId: { nodes: [] }
};

describe("resource editor location", () => {
  let profile: { location: string | null; latitude: number | string | null; longitude: number | string | null } | null;
  let editResource: Omit<typeof resource, "latitude" | "longitude" | "location"> & { latitude: number | string | null; longitude: number | string | null; location: string | null };
  let loadingProfile: boolean;

  function renderEditor() {
    mockForm = undefined;
    return renderToStaticMarkup(<CreateResourcePage />);
  }

  function picker(errors: Record<string, string> = {}, touched: Record<string, boolean> = {}, values = { ...mockForm!.initialValues }) {
    const setFieldTouched = jest.fn();
    const setFieldValue = jest.fn((field: string, value: unknown) => { values[field] = value; });
    const setValues = jest.fn((update: (current: Record<string, unknown>) => Record<string, unknown>) => {
      Object.assign(values, update(values));
    });
    let result: Record<string, any> | undefined;
    function collect(nodes: ReactNode) {
      Children.forEach(nodes, node => {
        if (!isValidElement<Record<string, any>>(node)) return;
        if (node.type === LocationPicker) result = node.props;
        collect(node.props.children);
      });
    }
    collect(mockForm!.children({ values, errors, touched, setFieldTouched, setFieldValue, setValues, submitForm: jest.fn() }));
    expect(result).toBeDefined();
    return { props: result!, setFieldTouched, setFieldValue, setValues, values };
  }

  beforeEach(() => {
    mockResourceId = undefined;
    mockRouterReady = true;
    profile = { location: "Profile address", latitude: 50.45, longitude: 4.35 };
    editResource = resource;
    loadingProfile = false;
    mockPublish.mockReset().mockResolvedValue({ data: { publishResource: { resource: { id: "listing" } } } });
    mockPush.mockReset().mockResolvedValue(true);
    jest.mocked(useMutation).mockReturnValue([mockPublish, { loading: false }] as unknown as ReturnType<typeof useMutation>);
    jest.mocked(useQuery).mockImplementation((document, options) => {
      const skip = typeof options === "object" && options !== null && options.skip;
      if (document === ACCOUNT_PROFILE_QUERY) {
        return { data: skip ? undefined : { accountById: profile }, loading: loadingProfile } as unknown as ReturnType<typeof useQuery>;
      }
      if (document === RESOURCE_EDIT_DETAIL_QUERY) {
        return { data: skip ? undefined : { resourceById: editResource }, loading: false } as unknown as ReturnType<typeof useQuery>;
      }
      return { data: { allCampaigns: { nodes: [] }, allResourceCategories: { nodes: [] } }, loading: false } as unknown as ReturnType<typeof useQuery>;
    });
  });

  it("prefills a new resource from the profile", () => {
    renderEditor();
    expect(mockForm!.initialValues).toMatchObject({ location: "Profile address", latitude: 50.45, longitude: 4.35 });
    expect(picker().props.value).toEqual({ address: "Profile address", latitude: 50.45, longitude: 4.35 });
    expect(jest.mocked(useQuery)).toHaveBeenCalledWith(ACCOUNT_PROFILE_QUERY, expect.objectContaining({ skip: false, variables: { accountId: "owner" } }));
  });

  it.each([0, "0"])("keeps zero profile coordinates (%p)", zero => {
    profile = { location: "Equator", latitude: zero, longitude: zero };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Equator", latitude: 0, longitude: 0 });
  });

  it.each([null, "", "   "])("does not invent a location from an absent profile address (%p)", location => {
    profile = { location, latitude: 50, longitude: 4 };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "", latitude: "", longitude: "" });
  });

  it("leaves missing profile coordinates empty and handles an absent profile", () => {
    profile = { location: "Profile address", latitude: null, longitude: null };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Profile address", latitude: "", longitude: "" });
    profile = null;
    renderEditor();
    expect(picker().props.value).toEqual({ address: "", latitude: "", longitude: "" });
  });

  it.each(["create", "edit"] as const)("submits a %s resource with an address but no coordinates", async mode => {
    profile = { location: "Profile address", latitude: null, longitude: null };
    if (mode === "edit") {
      mockResourceId = "listing";
      editResource = { ...resource, latitude: null, longitude: null };
    }
    renderEditor();
    await mockForm!.onSubmit(mockForm!.initialValues, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mockPublish).toHaveBeenCalledWith({ variables: expect.objectContaining({
      location: mode === "edit" ? "Resource address" : "Profile address",
      latitude: mode === "edit" ? null : undefined,
      longitude: mode === "edit" ? null : undefined
    }) });
    expect(mockPush).toHaveBeenCalledWith("/resources/manage");
  });

  it("uses the existing resource rather than the profile in edit mode", () => {
    mockResourceId = "listing";
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Resource address", latitude: 50.6, longitude: 3.4 });
    expect(jest.mocked(useQuery)).toHaveBeenCalledWith(ACCOUNT_PROFILE_QUERY, expect.objectContaining({ skip: true }));
  });

  it("converts GraphQL BigFloat strings to numeric map coordinates when reopening and saving", async () => {
    mockResourceId = "listing";
    editResource = { ...resource, latitude: "50.583800", longitude: "3.578596" };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Resource address", latitude: 50.5838, longitude: 3.578596 });
    await mockForm!.onSubmit(mockForm!.initialValues, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mockPublish).toHaveBeenCalledWith({ variables: expect.objectContaining({
      latitude: 50.5838, longitude: 3.578596
    }) });
  });

  it("preserves numeric zero and does not invent invalid edit coordinates", () => {
    mockResourceId = "listing";
    editResource = { ...resource, latitude: "0.000000", longitude: "invalid" };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Resource address", latitude: 0, longitude: "" });
  });

  it("preserves zero and missing edit coordinates without falling back to the profile", () => {
    mockResourceId = "listing";
    editResource = { ...resource, latitude: 0, longitude: null };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Resource address", latitude: 0, longitude: "" });
    editResource = { ...resource, location: null, latitude: null, longitude: null };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "", latitude: "", longitude: "" });
  });

  it("waits for the profile before mounting the create form", () => {
    loadingProfile = true;
    expect(renderEditor()).toContain("form.loading");
    expect(mockForm).toBeUndefined();
    loadingProfile = false;
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Profile address", latitude: 50.45, longitude: 4.35 });
  });

  it("does not mark the location picker required", () => {
    renderEditor();
    expect(picker().props.required).toBeFalsy();
    expect(mockForm!.validationSchema).toBe(createResourceValidationSchema);
  });

  it("writes all three selected values", () => {
    renderEditor();
    const { props, setFieldValue } = picker();
    props.onChange({ address: "Selected", latitude: 0, longitude: -4 });
    expect(setFieldValue).toHaveBeenCalledWith("location", "Selected");
    expect(setFieldValue).toHaveBeenCalledWith("latitude", 0);
    expect(setFieldValue).toHaveBeenCalledWith("longitude", -4);
  });

  it.each(["create", "edit"] as const)("clears all location fields in the %s form without losing edits", async mode => {
    if (mode === "edit") mockResourceId = "listing";
    renderEditor();
    const { props, setValues, values } = picker();
    values.title = "User edited title";
    values.description = "User edited description";

    props.onClear();

    expect(setValues).toHaveBeenCalledTimes(1);
    expect(values).toMatchObject({
      title: "User edited title", description: "User edited description",
      location: "", latitude: "", longitude: ""
    });
    // Formik converts empty strings to undefined before full-schema validation.
    await expect(createResourceValidationSchema.validate({ ...values, campaignId: undefined, defaultTokenAmount: undefined })).resolves.toMatchObject({
      location: "", latitude: null, longitude: null
    });
    await mockForm!.onSubmit(values, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mockPublish).toHaveBeenCalledWith({ variables: expect.objectContaining({
      resourceId: mode === "edit" ? "listing" : undefined,
      title: "User edited title", description: "User edited description",
      location: mode === "edit" ? null : undefined,
      latitude: mode === "edit" ? null : undefined,
      longitude: mode === "edit" ? null : undefined
    }) });
  });

  it("submits a newly selected location after clearing the existing one", async () => {
    mockResourceId = "listing";
    renderEditor();
    const { props, values } = picker();
    props.onClear();
    props.onChange({ address: "New address", latitude: 0, longitude: -4 });
    await mockForm!.onSubmit(values, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mockPublish).toHaveBeenCalledWith({ variables: expect.objectContaining({
      resourceId: "listing", location: "New address", latitude: 0, longitude: -4
    }) });
  });

  it("marks address and both coordinates touched and validates them on picker blur", () => {
    renderEditor();
    const { props, setFieldTouched } = picker();
    props.onBlur();
    expect(setFieldTouched).toHaveBeenCalledTimes(3);
    for (const field of ["location", "latitude", "longitude"]) {
      expect(setFieldTouched).toHaveBeenCalledWith(field, true, true);
    }
  });

  it.each([
    ["location", "addressError", "addressHelperText"],
    ["latitude", "coordinatesError", "coordinatesHelperText"],
    ["longitude", "coordinatesError", "coordinatesHelperText"]
  ])("exposes the touched %s validation error on the picker", (field, errorProp, helperProp) => {
    renderEditor();
    const errors = { [field]: `${field} error` };
    expect(picker(errors).props[errorProp]).toBe(false);
    expect(picker(errors).props[helperProp]).toBeUndefined();
    const { props } = picker(errors, { [field]: true });
    expect(props[errorProp]).toBe(true);
    expect(props[helperProp]).toBe(`${field} error`);
  });
});

describe("resource location validation", () => {
  // Formik converts empty strings to undefined before full-schema validation.
  const valid = { ...createResourceInitialValues, title: "Resource", campaignId: undefined, defaultTokenAmount: undefined, location: "Brussels", latitude: 50.85, longitude: 4.35 };

  it.each(["", "   ", undefined])("accepts a missing or blank address (%p)", async location => {
    await expect(createResourceValidationSchema.validateAt("location", { ...valid, location })).resolves.toBe(location?.trim());
  });

  it.each([
    ["latitude", ""], ["latitude", null], ["latitude", undefined],
    ["longitude", ""], ["longitude", null], ["longitude", undefined]
  ] as const)("accepts missing %s with an address (%p)", async (field, missing) => {
    await expect(createResourceValidationSchema.validateAt(field, { ...valid, [field]: missing }))
      .resolves.toBe(missing === undefined ? undefined : null);
  });

  it("accepts a full form with no location or coordinates", async () => {
    await expect(createResourceValidationSchema.validate({ ...valid, location: "", latitude: "", longitude: "" }))
      .resolves.toMatchObject({ location: "", latitude: null, longitude: null });
  });

  it("accepts a profile address with no coordinates", async () => {
    await expect(createResourceValidationSchema.validate({ ...valid, latitude: "", longitude: "" }))
      .resolves.toMatchObject({ location: "Brussels", latitude: null, longitude: null });
  });

  it.each([
    ["latitude", -90.01], ["latitude", 90.01],
    ["longitude", -180.01], ["longitude", 180.01]
  ] as const)("rejects out-of-range %s %s", async (field, value) => {
    await expect(createResourceValidationSchema.validateAt(field, { ...valid, [field]: value })).rejects.toThrow();
  });

  it.each([
    [0, 0], [-90, -180], [90, 180], [50.85, 4.35]
  ])("accepts valid coordinates %s, %s in the full form", async (latitude, longitude) => {
    await expect(createResourceValidationSchema.validate({ ...valid, latitude, longitude })).resolves.toMatchObject({ location: "Brussels", latitude, longitude });
  });
});