"use client";

import { clearStoredTokens, getRefreshToken, setStoredTokens, type AuthTokens } from "@/lib/auth/storage";

type GraphQLErrorLike = {
  message?: unknown;
  extensions?: {
    code?: unknown;
  };
};

type RefreshTokensResponse = {
  data?: {
    refreshToken?: {
      token: string;
      refreshToken: string;
      refreshExpiresIn?: number | null;
    };
  };
  errors?: Array<{
    message?: string;
    extensions?: {
      code?: string;
    };
  }>;
};

let refreshPromise: Promise<AuthTokens | null> | null = null;

export function getGraphqlEndpoint() {
  return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8000/graphql/";
}

export function getGraphQLErrorCode(error: unknown) {
  const graphQLError = (error as { graphQLErrors?: GraphQLErrorLike[] } | null)?.graphQLErrors?.[0];
  const code = graphQLError?.extensions?.code;

  return typeof code === "string" ? code : undefined;
}

export function shouldRefreshFromGraphQLErrors(errors?: readonly GraphQLErrorLike[]) {
  return (
    errors?.some((error) => {
      const code = typeof error.extensions?.code === "string" ? error.extensions.code : undefined;
      const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
      return (
        code === "AUTH_TOKEN_EXPIRED" ||
        code === "AUTH_TOKEN_INVALID" ||
        code === "AUTH_SESSION_REVOKED" ||
        code === "UNAUTHENTICATED" ||
        code === "AUTHENTICATION_FAILED" ||
        (message.includes("token") && (message.includes("expired") || message.includes("invalid"))) ||
        message.includes("signature has expired")
      );
    }) ?? false
  );
}

async function requestTokenRefresh() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearStoredTokens();
    return null;
  }

  const response = await fetch(getGraphqlEndpoint(), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        mutation Refresh($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            token
            refreshToken
            refreshExpiresIn
          }
        }
      `,
      variables: {
        refreshToken,
      },
    }),
  });

  const payload = (await response.json()) as RefreshTokensResponse;
  const nextTokens = payload.data?.refreshToken;

  if (!response.ok || !nextTokens || (payload.errors?.length ?? 0) > 0) {
    clearStoredTokens();
    return null;
  }

  setStoredTokens({
    token: nextTokens.token,
    refreshToken: nextTokens.refreshToken,
    refreshExpiresIn: nextTokens.refreshExpiresIn ?? null,
  });
  return {
    token: nextTokens.token,
    refreshToken: nextTokens.refreshToken,
    refreshExpiresIn: nextTokens.refreshExpiresIn ?? null,
  };
}

export async function refreshSessionTokens() {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
