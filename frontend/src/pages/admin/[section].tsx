import { useRouter } from "next/router";

import AdminSupportPage, {
  getAdminSectionOrder,
  isAdminSectionKey
} from "../../features/admin/AdminSupportPage";

export default function AdminSectionRoute() {
  const router = useRouter();
  const rawSection = typeof router.query.section === "string"
    ? router.query.section
    : getAdminSectionOrder()[0];

  if (!isAdminSectionKey(rawSection)) {
    return <AdminSupportPage section={getAdminSectionOrder()[0]} />;
  }

  return <AdminSupportPage section={rawSection} />;
}
