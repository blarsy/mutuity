import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/app/search",
    permanent: false
  }
});

export default function AppHomePage() {
  return null;
}
