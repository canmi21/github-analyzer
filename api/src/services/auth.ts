import { BunRequest } from "bun";
import { appOctokit } from "..";
import { createOAuthUserAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { sessionStore } from "./sessionStore";

// User session interface
export interface UserSession {
  login: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date | null;
  tokenType?: string;
  createdAt: Date;
}

export async function handleGithubAuth(req: BunRequest) {
  console.log("Handling GitHub authentication...");
  const params = new URLSearchParams(req.url.split("?")[1]);
  const { code, state } = Object.fromEntries(params.entries());

  // Get the auth result which includes tokens
  const authResult = (await appOctokit.auth({
    type: "oauth-user",
    code: code,
    state: state,
  })) as Record<string, any>;

  // Create user Octokit instance with the tokens
  const userOctokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      token: authResult.token,
      refreshToken: authResult.refreshToken,
      expiresAt: authResult.expiresAt,
      tokenType: authResult.tokenType,
    },
  });

  // Get user information
  const user = await userOctokit.rest.users.getAuthenticated();
  const username = user.data.login;
  console.log("Authenticated user:", username);

  // Create session object
  const sessionData: UserSession = {
    login: username,
    accessToken: authResult.token,
    refreshToken: authResult.refreshToken || null,
    expiresAt: authResult.expiresAt || null,
    tokenType: authResult.tokenType || "bearer",
    createdAt: new Date(),
  };

  // Generate session ID and store in Redis
  const sessionId = crypto.randomUUID();
  await sessionStore.saveSession(sessionId, sessionData);

  // Calculate expiry time for cookie (optional, can be session cookie)
  const cookieExpiry = authResult.expiresAt
    ? new Date(authResult.expiresAt).toUTCString()
    : undefined;

  // Return a response with a session cookie
  const headers = new Headers();
  const cookieOptions = [`session=${sessionId}`, "Path=/", "SameSite=Strict"];

  if (cookieExpiry) {
    cookieOptions.push(`Expires=${cookieExpiry}`);
  }

  headers.append("Set-Cookie", cookieOptions.join("; "));

  return new Response(
    JSON.stringify({
      success: true,
      user: { login: username },
    }),
    {
      status: 200,
      headers: headers,
    }
  );
}

// Helper function to get user session from request
export async function getUserSession(
  req: BunRequest
): Promise<UserSession | null> {
  const cookies = req.headers.get("cookie");
  if (!cookies) return null;

  const sessionCookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session="));

  if (!sessionCookie) return null;

  const sessionId = sessionCookie.split("=")[1];
  return await sessionStore.getSession(sessionId);
}

// Helper to create an authenticated Octokit instance from a session
export function createOctokitFromSession(session: UserSession): Octokit {
  return new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      token: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      tokenType: session.tokenType,
    },
  });
}

export async function getAuthenticatedUser(req: BunRequest) {
  const session = await getUserSession(req);
  if (!session)
    return Response.json(
      {
        state: "Failed",
        message: "No active session found.",
      },
      {
        status: 401,
      }
    );
  const octokit = createOctokitFromSession(session);
  const user = await octokit.rest.users.getAuthenticated();
  console.log("Authenticated user:", user.data.login);
  return Response.json(user.data);
}
