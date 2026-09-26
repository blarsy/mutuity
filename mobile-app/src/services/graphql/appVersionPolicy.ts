import { gql } from "@apollo/client";

import { apolloClient } from "./client";
import type { AppVersionFloor } from "../app/versionGate";

const APP_VERSION_POLICY_QUERY = gql`
  query AppVersionPolicy {
    appVersionPolicy {
      nodes {
        minIosSemver
        minAndroidSemver
      }
    }
  }
`;

interface AppVersionPolicyQueryResult {
  appVersionPolicy?: {
    nodes?: Array<{
      minIosSemver?: string | null;
      minAndroidSemver?: string | null;
    }>;
  } | null;
}

/**
 * Fetches the minimum version floor via the `appVersionPolicy` GraphQL query.
 *
 * NOTE: this is the *programmatic/consistency* surface — it cannot be the
 * bootstrapping mechanism for a too-old client, because the backend's GraphQL
 * version gate blocks an `x-app-version` below the floor (that request carries
 * the header) before this query ever resolves. A client whose version is too
 * old must learn the floor through the ungated REST `GET /health` endpoint
 * (see `fetchAppVersionFloor` in `../app/versionGate`). Keep both in sync.
 */
export async function fetchAppVersionPolicyViaGraphql(): Promise<AppVersionFloor | null> {
  try {
    const { data } = await apolloClient.query<AppVersionPolicyQueryResult>({
      query: APP_VERSION_POLICY_QUERY,
      fetchPolicy: "network-only"
    });

    const node = data?.appVersionPolicy?.nodes?.[0];
    if (!node) {
      return null;
    }

    return {
      minIosSemver: typeof node.minIosSemver === "string" ? node.minIosSemver : "0.0.0",
      minAndroidSemver: typeof node.minAndroidSemver === "string" ? node.minAndroidSemver : "0.0.0"
    };
  } catch {
    return null;
  }
}