import * as Yup from "yup";

export type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const changePasswordInitialValues: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

export const changePasswordValidationSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string().min(8, "Password must be at least 8 characters").required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm new password is required")
});

export function validateChangePasswordForm(values: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): {
  valid: boolean;
  errors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
} {
  const errors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } = {};

  if (!values.currentPassword.trim()) {
    errors.currentPassword = "Current password is required";
  }

  if (!values.newPassword) {
    errors.newPassword = "New password is required";
  } else if (values.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm new password is required";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
