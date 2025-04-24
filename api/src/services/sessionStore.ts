import { redis } from "bun";
import { UserSession } from "./auth";
import { Octokit } from "octokit";
import { createOAuthUserAuth } from "@octokit/auth-app";

// Session expiration in seconds (default: 7 days)
const SESSION_TTL = parseInt(process.env.SESSION_TTL || "604800");

class SessionStore {
  /**
   * Save session data to Redis
   * @param sessionId The session ID
   * @param session Session data
   * @returns Promise that resolves when the session is saved
   */
  async saveSession(sessionId: string, session: UserSession): Promise<void> {
    await redis.set(`session:${sessionId}`, JSON.stringify(session));
    await redis.expire(`session:${sessionId}`, SESSION_TTL);
  }

  /**
   * Get session data from Redis
   * @param sessionId The session ID
   * @returns Session data or null if not found
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    const data = await redis.get(`session:${sessionId}`);
    if (!data) return null;

    try {
      const session = JSON.parse(data) as UserSession;

      // Convert date strings back to Date objects
      if (session.expiresAt) {
        session.expiresAt = new Date(session.expiresAt);
      }
      if (session.createdAt) {
        session.createdAt = new Date(session.createdAt);
      }

      return session;
    } catch (error) {
      console.error("Error parsing session data:", error);
      return null;
    }
  }

  /**
   * Remove a session from Redis
   * @param sessionId The session ID
   */
  async removeSession(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`);
  }

  /**
   * Update an existing session with new data
   * @param sessionId The session ID
   * @param updatedData The updated session data
   */
  async updateSession(
    sessionId: string,
    updatedData: Partial<UserSession>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const updatedSession = { ...session, ...updatedData };
    await this.saveSession(sessionId, updatedSession);
  }

  /**
   * Refresh a token if it's close to expiration
   * @param sessionId The session ID
   */
  async refreshTokenIfNeeded(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session || !session.expiresAt || !session.refreshToken) return false;

    // Check if token expires within 1 hour
    const expiryTime = new Date(session.expiresAt).getTime();
    const currentTime = Date.now();
    const oneHourInMs = 60 * 60 * 1000;

    if (expiryTime - currentTime > oneHourInMs) {
      return false; // No need to refresh yet
    }

    try {
      // Create a temporary Octokit instance for refreshing
      const octokit = new Octokit({
        authStrategy: createOAuthUserAuth,
        auth: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          refreshToken: session.refreshToken,
        },
      });

      // Refresh the token
      const auth = (await octokit.auth({
        type: "refresh",
        refreshToken: session.refreshToken,
      })) as any;

      // Update session with new tokens
      await this.updateSession(sessionId, {
        accessToken: auth.token,
        refreshToken: auth.refreshToken,
        expiresAt: auth.expiresAt ? new Date(auth.expiresAt) : null,
      });

      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }
}

export const sessionStore = new SessionStore();
