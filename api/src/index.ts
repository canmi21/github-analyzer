import { createAppAuth } from "@octokit/auth-app";
import { serve } from "bun";
import { Octokit } from "octokit";
import { getAuthenticatedUser, handleGithubAuth } from "./services/auth";
import { fetchUserDataEndpoint, generateReport, getPresets } from "./services/generateReport";
import OpenAI from "openai";

process.env.TZ = "Asia/Shanghai";

export const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
  },
});

export const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30 * 1000,
  maxRetries: 1,
})

// Setup Bun's HTTP server
const PORT = process.env.PORT || 3000;

serve({
  idleTimeout: 120,
  port: PORT,
  websocket: {
    message: () => { }, // Empty handler
  },
  routes: {
    "/api/code": handleGithubAuth,
    "/api/data": fetchUserDataEndpoint,
    "/api/user": getAuthenticatedUser,
    "/api/report": generateReport,
    "/api/presets": getPresets,
  },
  error(error) {
    console.error(error);
    return new Response(`Internal Error: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
});

console.log(`Server running on http://localhost:${PORT}`);
// console.log(`Visit http://localhost:${PORT}/login to authenticate with GitHub`);
