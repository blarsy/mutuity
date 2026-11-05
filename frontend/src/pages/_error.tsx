import * as Sentry from "@sentry/nextjs";
import NextError, { type ErrorProps } from "next/error";
import type { NextPageContext } from "next";

export default function ErrorPage(props: ErrorProps) {
  return <NextError statusCode={props.statusCode} />;
}

ErrorPage.getInitialProps = async (context: NextPageContext) => {
  await Sentry.captureUnderscoreErrorException(context);
  return NextError.getInitialProps(context);
};