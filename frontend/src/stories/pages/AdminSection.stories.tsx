import type { Meta, StoryObj } from "@storybook/react";

import AdminSectionRoute from "../../pages/admin/[section]";
import { ADMIN_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof AdminSectionRoute> = {
  title: "Pages/Admin/Admin Section",
  component: AdminSectionRoute,
  parameters: pageParameters({
    pathname: "/admin/[section]",
    asPath: "/admin/accounts",
    query: { section: "accounts" },
    session: ADMIN_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof AdminSectionRoute>;

function sectionStory(section: string): Story {
  return {
    parameters: {
      nextjs: {
        router: { pathname: "/admin/[section]", asPath: `/admin/${section}`, query: { section } }
      }
    }
  };
}

export const Accounts = sectionStory("accounts");
export const Bids = sectionStory("bids");
export const Resources = sectionStory("resources");
export const Notifications = sectionStory("notifications");
export const Mails = sectionStory("mails");
export const Campaigns = sectionStory("campaigns");
export const Grants = sectionStory("grants");
export const Logs = sectionStory("logs");
export const UnknownSection = sectionStory("does-not-exist");
