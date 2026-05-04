"use client";

import { ApolloProvider } from "@apollo/client";
import { AuthProvider } from "@/features/auth/auth-context";
import { getApolloClient } from "@/lib/graphql/apollo-client";

type AppProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ApolloProvider client={getApolloClient()}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}
