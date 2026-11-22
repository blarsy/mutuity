import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useMutation, useQuery } from "@apollo/client/react";
import EditNeedPage from "../../src/features/needs/CreateNeedPage";
import { LocationPicker } from "../../src/components/LocationPicker";
import { ACCOUNT_PROFILE_QUERY } from "../../src/features/profile/profile.queries";
import { CREATE_NEED_MUTATION, NEED_EDIT_DETAIL_QUERY, UPDATE_NEED_MUTATION } from "../../src/features/needs/needs.queries";
import { createNeedInitialValues, createNeedValidationSchema, type CreateNeedValues } from "../../src/features/needs/createNeed.validation";

type FormProps = {
  initialValues: CreateNeedValues;
  validationSchema: typeof createNeedValidationSchema;
  onSubmit: (values: CreateNeedValues, helpers: { setStatus: jest.Mock; setSubmitting: jest.Mock }) => Promise<void>;
  children: (props: Record<string, unknown>) => ReactNode;
};

let mockForm: FormProps | undefined;
let mockNeedId: string | undefined;
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockLink = jest.fn();
const mockPush = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ isReady: true, query: mockNeedId ? { needId: mockNeedId } : {}, push: mockPush }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: jest.fn() }));
jest.mock("formik", () => ({ Formik: (props: FormProps) => { mockForm = props; return null; }, Form: () => null }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: { account: { id: "owner" } } }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({ useRequireAuth: () => ({ isAuthenticated: true }) }));
jest.mock("../../src/components/ImageUploadField", () => ({ ImageUploadField: () => null }));
jest.mock("../../src/components/richText/RichTextEditor", () => ({ RichTextEditor: () => null }));
jest.mock("../../src/components/LocationPicker", () => ({ LocationPicker: () => null }));

const need = {
  id: "listing", title: "Need", description: "Details", imageUrls: [],
  location: "Saved address" as string | null, latitude: 50.6 as number | string | null, longitude: 3.4 as number | string | null,
  intensity: "SHARING", proposedTopesAmount: null, expiresAt: null,
  objectRequired: true, competenceRequired: false, toolingRequired: false, multiplePeopleRequired: false,
  requiredCompetenceText: null, requiredToolingText: null, requiredPeopleCount: null,
  campaignNeedsByNeedId: { nodes: [] }
};

describe("need editor location", () => {
  let profile: { location: string | null; latitude: number | string | null; longitude: number | string | null } | null;
  let editNeed: typeof need;

  function renderEditor() {
    mockForm = undefined;
    renderToStaticMarkup(<EditNeedPage />);
    expect(mockForm).toBeDefined();
  }

  function picker(errors: Record<string, string> = {}, touched: Record<string, boolean> = {}) {
    let values = { ...mockForm!.initialValues };
    const setValues = jest.fn((update: (previous: CreateNeedValues) => CreateNeedValues) => { values = update(values); });
    const setFieldValue = jest.fn();
    const setFieldTouched = jest.fn();
    let result: Record<string, any> | undefined;
    function collect(nodes: ReactNode) {
      Children.forEach(nodes, node => {
        if (!isValidElement<Record<string, any>>(node)) return;
        if (node.type === LocationPicker) result = node.props;
        collect(node.props.children);
      });
    }
    collect(mockForm!.children({ values, errors, touched, setFieldValue, setFieldTouched, setValues, submitForm: jest.fn() }));
    expect(result).toBeDefined();
    return { props: result!, setValues, setFieldValue, setFieldTouched, getValues: () => values };
  }

  beforeEach(() => {
    mockNeedId = undefined;
    profile = { location: "Profile address", latitude: 50.45, longitude: 4.35 };
    editNeed = { ...need };
    mockCreate.mockReset().mockResolvedValue({});
    mockUpdate.mockReset().mockResolvedValue({});
    mockLink.mockReset().mockResolvedValue({});
    mockPush.mockReset().mockResolvedValue(true);
    jest.mocked(useMutation).mockImplementation(document => {
      const mutation = document === CREATE_NEED_MUTATION ? mockCreate : document === UPDATE_NEED_MUTATION ? mockUpdate : mockLink;
      return [mutation, { loading: false }] as unknown as ReturnType<typeof useMutation>;
    });
    jest.mocked(useQuery).mockImplementation((document, options) => {
      const skip = typeof options === "object" && options !== null && options.skip;
      if (document === ACCOUNT_PROFILE_QUERY) return { data: skip ? undefined : { accountById: profile }, loading: false } as unknown as ReturnType<typeof useQuery>;
      if (document === NEED_EDIT_DETAIL_QUERY) return { data: skip ? undefined : { needById: editNeed }, loading: false } as unknown as ReturnType<typeof useQuery>;
      return { data: { allCampaigns: { nodes: [] } }, loading: false } as unknown as ReturnType<typeof useQuery>;
    });
  });

  it("prefills from the profile on create and from the saved need on edit", () => {
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Profile address", latitude: 50.45, longitude: 4.35 });
    mockNeedId = "listing";
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Saved address", latitude: 50.6, longitude: 3.4 });
    expect(jest.mocked(useQuery)).toHaveBeenCalledWith(ACCOUNT_PROFILE_QUERY, expect.objectContaining({ skip: true }));
  });

  it("handles null edit fields and preserves zero without falling back to the profile", () => {
    mockNeedId = "listing";
    editNeed = { ...need, location: null, latitude: null, longitude: null };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "", latitude: "", longitude: "" });
    editNeed = { ...need, latitude: "0", longitude: 0 };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "Saved address", latitude: 0, longitude: 0 });
  });

  it.each([null, "", "   "])("does not invent coordinates for an absent profile address (%p)", location => {
    profile = { location, latitude: 50, longitude: 4 };
    renderEditor();
    expect(picker().props.value).toEqual({ address: "", latitude: "", longitude: "" });
  });

  it.each(["create", "edit"] as const)("clears all %s form fields and submits explicit nulls", async mode => {
    if (mode === "edit") mockNeedId = "listing";
    renderEditor();
    const control = picker();
    expect(control.props.required).toBeFalsy();
    control.props.onClear();
    expect(control.setValues).toHaveBeenCalledTimes(1);
    const cleared = { ...control.getValues(), title: "Need" };
    expect(cleared).toMatchObject({ location: "", latitude: "", longitude: "" });
    await expect(mockForm!.validationSchema.validate({ ...cleared, campaignId: undefined })).resolves.toMatchObject({ location: "", latitude: null, longitude: null });
    await mockForm!.onSubmit(cleared, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mode === "edit" ? mockUpdate : mockCreate).toHaveBeenCalledWith({ variables: expect.objectContaining({
      ...(mode === "edit" ? { id: "listing" } : {}), location: null, latitude: null, longitude: null
    }) });
    expect(mode === "edit" ? mockCreate : mockUpdate).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/needs/manage");
  });

  it.each(["create", "edit"] as const)("submits %s with an address and missing coordinates", async mode => {
    profile = { location: " Profile address ", latitude: null, longitude: null };
    if (mode === "edit") { mockNeedId = "listing"; editNeed = { ...need, latitude: null, longitude: null }; }
    renderEditor();
    await mockForm!.onSubmit({ ...mockForm!.initialValues, title: "Need" }, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mode === "edit" ? mockUpdate : mockCreate).toHaveBeenCalledWith({ variables: expect.objectContaining({
      location: mode === "edit" ? "Saved address" : "Profile address", latitude: null, longitude: null
    }) });
  });

  it.each(["create", "edit"] as const)("preserves zero coordinates and trims location on %s", async mode => {
    if (mode === "edit") mockNeedId = "listing";
    renderEditor();
    await mockForm!.onSubmit({ ...mockForm!.initialValues, title: "Need", location: " Equator ", latitude: 0, longitude: 0 }, { setStatus: jest.fn(), setSubmitting: jest.fn() });
    expect(mode === "edit" ? mockUpdate : mockCreate).toHaveBeenCalledWith({ variables: expect.objectContaining({ location: "Equator", latitude: 0, longitude: 0 }) });
  });

  it("updates a selected location and shows coordinate errors after blur", () => {
    renderEditor();
    const control = picker({ longitude: "out of range" }, { longitude: true });
    control.props.onChange({ address: "Selected", latitude: 0, longitude: -4 });
    expect(control.setFieldValue).toHaveBeenCalledWith("location", "Selected");
    expect(control.setFieldValue).toHaveBeenCalledWith("latitude", 0);
    expect(control.setFieldValue).toHaveBeenCalledWith("longitude", -4);
    control.props.onBlur();
    for (const field of ["location", "latitude", "longitude"]) expect(control.setFieldTouched).toHaveBeenCalledWith(field, true, true);
    expect(control.props.coordinatesError).toBe(true);
    expect(control.props.coordinatesHelperText).toBe("out of range");
    expect(picker({ latitude: "out of range" }).props.coordinatesError).toBe(false);
  });

  it.each([CREATE_NEED_MUTATION, UPDATE_NEED_MUTATION])("declares the location variable nullable", document => {
    const operation = document.definitions.find(definition => definition.kind === "OperationDefinition");
    expect(operation?.kind).toBe("OperationDefinition");
    if (operation?.kind !== "OperationDefinition") throw new Error("Missing operation");
    const location = operation.variableDefinitions?.find(variable => variable.variable.name.value === "location");
    expect(location?.type.kind).toBe("NamedType");
  });
});

describe("need location validation", () => {
  const valid = { ...createNeedInitialValues, title: "Need" };

  it.each(["", "   ", undefined])("accepts a blank or absent address (%p)", async location => {
    await expect(createNeedValidationSchema.validateAt("location", { ...valid, location })).resolves.toBe(location?.trim());
  });

  it.each(["latitude", "longitude"] as const)("accepts missing %s alongside an address", async field => {
    for (const value of ["", "   ", null, undefined]) {
      await expect(createNeedValidationSchema.validateAt(field, { ...valid, location: "Brussels", [field]: value })).resolves.toBe(value === undefined ? undefined : null);
    }
  });

  it.each([[0, 0], [-90, -180], [90, 180], [50.85, 4.35]])("accepts coordinates %s, %s", async (latitude, longitude) => {
    await expect(createNeedValidationSchema.validate({ ...valid, campaignId: undefined, latitude, longitude })).resolves.toMatchObject({ latitude, longitude });
  });

  it.each([["latitude", -90.01], ["latitude", 90.01], ["longitude", -180.01], ["longitude", 180.01], ["latitude", "invalid"], ["longitude", "invalid"]] as const)("rejects invalid %s %s", async (field, value) => {
    await expect(createNeedValidationSchema.validateAt(field, { ...valid, [field]: value })).rejects.toThrow();
  });
});
