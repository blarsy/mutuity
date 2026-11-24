import type { GetServerSidePropsContext } from "next";
import { getServerSideProps } from "../../src/pages/app";

it("temporarily redirects the app home to search", async () => {
  await expect(getServerSideProps({} as GetServerSidePropsContext)).resolves.toEqual({
    redirect: { destination: "/app/search", permanent: false }
  });
});