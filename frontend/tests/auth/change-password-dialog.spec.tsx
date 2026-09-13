import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ChangePasswordDialog } from "../../src/features/auth/ChangePasswordDialog";
import {
  changePasswordValidationSchema,
  validateChangePasswordForm
} from "../../src/features/auth/changePassword.validation";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key
  })
}));

jest.mock("../../src/features/auth/auth.api", () => ({
  changePassword: jest.fn().mockResolvedValue({
    authenticated: true,
    role: "identified_account"
  })
}));

describe("ChangePasswordDialog", () => {
  it("renders the dialog with required password fields and actions when open", () => {
    const markup = renderToStaticMarkup(
      createElement(ChangePasswordDialog, {
        open: true,
        disablePortal: true,
        onClose: () => undefined
      })
    );

    expect(markup).toContain("changePassword.title");
    expect(markup).toContain("changePassword.currentPasswordLabel");
    expect(markup).toContain("changePassword.newPasswordLabel");
    expect(markup).toContain("changePassword.confirmPasswordLabel");
    expect(markup).toContain("Cancel");
    expect(markup).toContain("OK");
  });

  it("does not render dialog content when open is false", () => {
    const markup = renderToStaticMarkup(
      createElement(ChangePasswordDialog, {
        open: false,
        disablePortal: true,
        onClose: () => undefined
      })
    );

    expect(markup).not.toContain("changePassword.currentPasswordLabel");
  });

  describe("validation", () => {
    it("flags empty fields", () => {
      const result = validateChangePasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      expect(result.valid).toBe(false);
      expect(result.errors.currentPassword).toBe("Current password is required");
      expect(result.errors.newPassword).toBe("New password is required");
      expect(result.errors.confirmPassword).toBe("Confirm new password is required");
    });

    it("flags short passwords under 8 characters", () => {
      const result = validateChangePasswordForm({
        currentPassword: "oldpassword",
        newPassword: "short",
        confirmPassword: "short"
      });

      expect(result.valid).toBe(false);
      expect(result.errors.newPassword).toBe("Password must be at least 8 characters");
    });

    it("flags mismatched confirm passwords", () => {
      const result = validateChangePasswordForm({
        currentPassword: "oldpassword",
        newPassword: "validpassword123",
        confirmPassword: "differentpassword"
      });

      expect(result.valid).toBe(false);
      expect(result.errors.confirmPassword).toBe("Passwords must match");
    });

    it("accepts valid inputs", () => {
      const result = validateChangePasswordForm({
        currentPassword: "oldpassword",
        newPassword: "validpassword123",
        confirmPassword: "validpassword123"
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("validates with yup schema", async () => {
      await expect(
        changePasswordValidationSchema.validate({
          currentPassword: "oldpassword",
          newPassword: "validpassword123",
          confirmPassword: "validpassword123"
        })
      ).resolves.toBeTruthy();

      await expect(
        changePasswordValidationSchema.validate({
          currentPassword: "",
          newPassword: "short",
          confirmPassword: "diff"
        })
      ).rejects.toThrow();
    });
  });
});
