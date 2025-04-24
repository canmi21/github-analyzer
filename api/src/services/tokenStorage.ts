import { Octokit } from "octokit";

// User session interface
export interface UserSession {
  login: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  octokit: Octokit;
}

// In-memory storage (replace with database for production)
class TokenStorage {
  private sessions = new Map<string, UserSession>();

  // Store a user session
  storeSession(sessionId: string, session: UserSession): void {
    this.sessions.set(sessionId, session);
  }

  // Retrieve a user session
  getSession(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Remove a session
  removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // Check if token needs refresh and refresh it
  async refreshIfNeeded(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.expiresAt || !session.refreshToken) return false;

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiryDate = new Date(session.expiresAt);
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiryDate.getTime() - now.getTime() > fiveMinutes) {
      return false; // No need to refresh
    }

    try {
      // Refresh token using Octokit
      const auth = await session.octokit.auth({
        type: "refresh",
        refreshToken: session.refreshToken,
      }) as Record<string, any>;

      // Update session with new tokens
      session.accessToken = auth.token;
      session.refreshToken = auth.refreshToken;
      session.expiresAt = auth.expiresAt;
      
      // Update the stored session
      this.sessions.set(sessionId, session);
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }
}

export const tokenStorage = new TokenStorage();
