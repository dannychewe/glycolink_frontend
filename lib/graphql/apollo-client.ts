import { ApolloClient, ApolloLink, InMemoryCache, Observable } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { createUploadLink } from "apollo-upload-client";
import { getAccessToken } from "@/lib/auth/storage";
import { refreshSessionTokens, shouldRefreshFromGraphQLErrors } from "@/lib/auth/session";

let apolloClient: ApolloClient<unknown> | null = null;

function createApolloClient() {
  const authLink = new ApolloLink((operation, forward) => {
    const accessToken = getAccessToken();

    operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
      headers: accessToken
        ? {
            ...headers,
            Authorization: `Bearer ${accessToken}`,
          }
        : headers,
    }));

    return forward(operation);
  });

  const errorLink = onError(({ graphQLErrors, operation, forward }) => {
    if (!shouldRefreshFromGraphQLErrors(graphQLErrors)) {
      return;
    }

    return new Observable((observer) => {
      void refreshSessionTokens()
        .then((tokens) => {
          if (!tokens) {
            if (typeof window !== "undefined") {
              window.location.replace("/login?reason=session_expired");
            }
            observer.error(new Error("Session expired. Please log in again."));
            return;
          }

          operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${tokens.token}`,
            },
          }));

          forward(operation).subscribe(observer);
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  });

  return new ApolloClient({
    link: ApolloLink.from([
      errorLink,
      authLink,
      createUploadLink({
        uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8000/graphql/",
        credentials: "include",
      }),
    ]),
    cache: new InMemoryCache(),
    devtools: {
      enabled: process.env.NODE_ENV !== "production",
    },
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
      },
    },
  });
}

export function getApolloClient() {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }

  return apolloClient;
}
