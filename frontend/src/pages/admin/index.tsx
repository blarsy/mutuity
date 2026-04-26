import { useEffect } from "react";
import { useRouter } from "next/router";

import { adminSectionHref, getAdminSectionOrder } from "../../features/admin/AdminSupportPage";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const firstSection = getAdminSectionOrder()[0];
    void router.replace(adminSectionHref(firstSection));
  }, [router]);

  return null;
}
