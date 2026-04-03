import * as Yup from "yup";

export type LoginValues = {
  identifier: string;
  password: string;
};

export const loginInitialValues: LoginValues = {
  identifier: "",
  password: ""
};

export const loginValidationSchema = Yup.object({
  identifier: Yup.string().trim().required("Email or account identifier is required"),
  password: Yup.string().required("Password is required")
});
