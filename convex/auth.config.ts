import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://peaceful-lobster-8.clerk.accounts.dev/",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
// "https://civil-mutt-21.clerk.accounts.dev/",
