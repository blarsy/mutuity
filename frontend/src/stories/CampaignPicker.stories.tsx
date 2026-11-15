import { useState } from "react";
import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { CampaignPicker } from "../features/campaigns/CampaignPicker";

const options = [
  { id: "campaign-a", title: "Community Garden" },
  { id: "campaign-b", title: "Food Sharing" }
];

function Example({ multiple = false, allowEmpty = true }: { multiple?: boolean; allowEmpty?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Box sx={{ maxWidth: 480, p: 3 }}>
      <CampaignPicker label="Campaigns" options={options} selected={selected} onChange={setSelected} multiple={multiple} allowEmpty={allowEmpty} />
      <Typography data-testid="selected">{selected.join(",") || "none"}</Typography>
    </Box>
  );
}

const meta: Meta<typeof Example> = { title: "Components/Campaign Picker", component: Example, parameters: { appShell: false } };
export default meta;
type Story = StoryObj<typeof Example>;

export const Single: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole("button", { name: /Campaigns:/ }));
    let dialog = within(await body.findByRole("dialog"));
    const link = dialog.getByRole("link", { name: /Community Garden/ });
    await expect(link).toHaveAttribute("href", "/campaigns/campaign-a");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await userEvent.click(dialog.getByRole("radio", { name: "Community Garden" }));
    await userEvent.click(dialog.getByRole("button", { name: /Appliquer|Apply/ }));
    await expect(canvas.getByTestId("selected")).toHaveTextContent("campaign-a");
    await userEvent.click(await canvas.findByRole("button", { name: /Campaigns:/ }));
    dialog = within(await body.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("radio", { name: "Food Sharing" }));
    await userEvent.click(dialog.getByRole("button", { name: /Annuler|Cancel/ }));
    await expect(canvas.getByTestId("selected")).toHaveTextContent("campaign-a");
    await userEvent.click(await canvas.findByRole("button", { name: /Campaigns:/ }));
    dialog = within(await body.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("radio", { name: /Aucune campagne|No campaign/ }));
    await userEvent.click(dialog.getByRole("button", { name: /Appliquer|Apply/ }));
    await expect(canvas.getByTestId("selected")).toHaveTextContent("none");
  }
};

export const Multiple: Story = {
  args: { multiple: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole("button", { name: /Campaigns:/ }));
    let dialog = within(await body.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Community Garden" }));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Food Sharing" }));
    await userEvent.click(dialog.getByRole("button", { name: /Appliquer|Apply/ }));
    await expect(canvas.getByTestId("selected")).toHaveTextContent("campaign-a,campaign-b");
    await userEvent.click(await canvas.findByRole("button", { name: /Campaigns:/ }));
    dialog = within(await body.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Community Garden" }));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Food Sharing" }));
    await userEvent.click(dialog.getByRole("button", { name: /Appliquer|Apply/ }));
    await expect(canvas.getByTestId("selected")).toHaveTextContent("none");
  }
};