import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import { DateTimePickerField } from "../components/DateTimePickerField";

function DateTimePickerExample({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <Box sx={{ maxWidth: 480, p: 3 }}>
      <Stack spacing={2}>
        <DateTimePickerField fullWidth label="Date" name="date" value={value} onChange={setValue} />
        <Typography data-testid="date-value" variant="body2">{value || "No date"}</Typography>
      </Stack>
    </Box>
  );
}

const meta: Meta<typeof DateTimePickerExample> = {
  title: "Components/Date Time Picker Field",
  component: DateTimePickerExample,
  parameters: { appShell: false }
};

export default meta;
type Story = StoryObj<typeof DateTimePickerExample>;
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Date" });
    await expect(input).toHaveAttribute("placeholder", "--/--/---- --:--");
    await userEvent.click(canvas.getByRole("button", { name: /Choisir la date|Choose date/ }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await userEvent.click(dialog.getByRole("gridcell", { name: "20" }));
    await userEvent.click(dialog.getByRole("button", { name: "OK" }));
    await expect(canvas.getByTestId("date-value")).not.toHaveTextContent("No date");

    await userEvent.click(canvas.getByRole("button", { name: /Effacer la valeur|Clear value/ }));
    await expect(canvas.getByTestId("date-value")).toHaveTextContent("No date");
  }
};
export const Populated: Story = { args: { initialValue: "2028-02-29T16:45" } };