declare module "apollo-upload-client" {
  import type { ApolloLink } from "@apollo/client";

  export type UploadLinkOptions = {
    uri?: string;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
  };

  export function createUploadLink(options?: UploadLinkOptions): ApolloLink;
}
