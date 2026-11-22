import { renderToStaticMarkup } from "react-dom/server";
import { SupportReportDetails } from "../../src/features/admin/SupportReportDetails";

describe("support report details", () => {
  it("renders all report fields and diagnostics as escaped text", () => {
    const html = renderToStaticMarkup(<SupportReportDetails report={{
      id: "report-id", createdAt: "2026-11-22T12:00:00Z", accountId: "account-id", accountName: "Alice",
      summary: "<img src=x onerror=alert(1)>", description: "first line\n<script>alert(2)</script>",
      diagnostics: { platform: "ios", nested: { value: "<script>alert(3)</script>" } }
    }} />);
    for (const text of ["report-id", "account-id", "Alice", "Summary", "Description", "Diagnostics", "platform", "nested", "ios"]) {
      expect(html).toContain(text);
    }
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&lt;script&gt;alert(2)&lt;/script&gt;");
    expect(html).toContain("&lt;script&gt;alert(3)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });

  it("handles absent, string, and structured diagnostics without dropping details", () => {
    const missing = renderToStaticMarkup(<SupportReportDetails report={{}} />);
    expect(missing).toContain("Diagnostics");
    expect(missing).not.toContain("Invalid Date");
    const text = renderToStaticMarkup(<SupportReportDetails report={{ diagnostics: "<b>raw</b>\nmore" }} />);
    expect(text).toContain("&lt;b&gt;raw&lt;/b&gt;");
    expect(text).toContain("more");
    expect(text).not.toContain("<b>raw</b>");
  });
});