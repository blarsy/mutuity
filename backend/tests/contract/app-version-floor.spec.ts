import type { Pool } from "pg";

describe("app version floor database boundary", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("reads the existing public function and caches its result", async () => {
    const { getAppVersionFloor } = await import("../../src/postgraphile/version.js");
    const floor = { minIosSemver: "1.2.3", minAndroidSemver: "2.3.4" };
    const query = jest.fn().mockResolvedValue({ rows: [floor] });
    const pool = { query } as unknown as Pool;

    expect(await getAppVersionFloor(pool)).toEqual(floor);
    expect(await getAppVersionFloor(pool)).toEqual(floor);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      'select min_ios_semver as "minIosSemver", min_android_semver as "minAndroidSemver" from app_public.app_version_policy()'
    );
  });

  it("retains the bootstrap fallback if the function is not yet available", async () => {
    const { getAppVersionFloor } = await import("../../src/postgraphile/version.js");
    const query = jest.fn().mockRejectedValue(new Error("function does not exist"));
    const pool = { query } as unknown as Pool;

    expect(await getAppVersionFloor(pool)).toEqual({
      minIosSemver: "0.0.0",
      minAndroidSemver: "0.0.0"
    });
  });
});