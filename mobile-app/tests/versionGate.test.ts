import { appSettings } from "../src/config/appSettings";
import {
  fetchAppVersionFloor,
  getCurrentAppPlatform,
  getCurrentAppVersion
} from "../src/services/app/versionGate";

describe("app version routing metadata", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends app version and platform on the ungated health request", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ appVersionPolicy: { minIosSemver: "1.0.0", minAndroidSemver: "1.0.0" } })
    } as Response);

    await expect(fetchAppVersionFloor()).resolves.toEqual({
      minIosSemver: "1.0.0",
      minAndroidSemver: "1.0.0"
    });

    expect(fetchMock).toHaveBeenCalledWith(`${appSettings.apiUrl}/health`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-app-version": getCurrentAppVersion(),
        "x-app-platform": getCurrentAppPlatform()
      }
    });
  });
});
