import { BunRequest } from "bun";
import { sessionStore } from "./sessionStore";
import { createOctokitFromSession } from "./auth";
import { Octokit } from "octokit";
import { openai } from "..";
import { createClient } from "redis";
import { presets } from "../utils/presets";
import { PullRequest, UserData } from "../types/data";

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Connect to Redis when the file is loaded
(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Redis connection error:", err);
  }
})();

// Function to get user data from cache
async function getUserDataFromCache(login: string): Promise<UserData | null> {
  try {
    const cachedData = await redisClient.get(`userdata:${login}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (err) {
    console.error("Redis cache get error:", err);
    return null;
  }
}

// Function to save user data to cache
async function saveUserDataToCache(
  login: string,
  data: UserData
): Promise<void> {
  try {
    await redisClient.set(`userdata:${login}`, JSON.stringify(data));
    // Set expiration to 1 hour (in seconds)
    await redisClient.expire(`userdata:${login}`, 60 * 60);
  } catch (err) {
    console.error("Redis cache save error:", err);
  }
}

async function fetchUserData(octokit: Octokit): Promise<UserData> {
  const currentUser = await octokit.rest.users.getAuthenticated();
  const { login, node_id: userId } = currentUser.data;

  // Check if we have cached data
  const cachedData = await getUserDataFromCache(login);
  if (cachedData) {
    console.log(`Using cached user data for ${login}`);
    return cachedData;
  }

  console.log(`Fetching fresh user data for ${login}`);
  const commitData: any = await octokit.graphql(`
    query {
      user(login: "${login}") {
        name
        bio
        location
        status {
          emoji
          message
        }
        pullRequests(first: 20, orderBy: {
          field: CREATED_AT
          direction: DESC
        }) {
          nodes {
            repository {
              nameWithOwner
              description
            }
            title
            body
            createdAt
          }
        }
        repositoriesContributedTo(
          first: 20
          privacy: PUBLIC
          orderBy: {
            field: UPDATED_AT
            direction: DESC
          }
          includeUserRepositories: true
          contributionTypes: [COMMIT]
        ) {
          nodes {
            description
            nameWithOwner
            mainCommits: defaultBranchRef {
              target {
                ... on Commit {
                  history(
                    first: 30
                    author: {id: "${userId}"}
                  ) {
                    nodes {
                      message
                      committedDate
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  let profileContent = "";
  try {
    const profileResp = await octokit.rest.repos.getContent({
      owner: login,
      repo: login,
      path: "README.md",
    });
    const profileStatus = profileResp.status;
    if (profileStatus !== 200) {
      console.error("Failed to fetch profile content:", profileStatus);
      profileContent = "Profile content not available.";
    } else {
      profileContent = Buffer.from(
        (profileResp.data as any).content,
        "base64"
      ).toString("utf-8");
    }
  } catch (err) {
    console.error("Error fetching profile content:", err);
    profileContent = "Profile content not available.";
  }

  // Parse the commit data to feed llm
  const parsedCommits = commitData.user.repositoriesContributedTo.nodes
    .filter(
      (repo: any) =>
        repo !== null &&
        repo.mainCommits !== null &&
        repo.mainCommits.target !== null
    )
    .map((repo: any) => {
      const { nameWithOwner, description, mainCommits } = repo;
      // Handle null mainCommits with optional chaining and default to empty array
      const nodes = mainCommits?.target?.history?.nodes;
      const commits =
        nodes?.map((commit: any) => {
          return {
            message: commit.message,
            committedDate: new Date(commit.committedDate).toLocaleString(
              "zh-CN"
            ),
          };
        }) || [];
      return {
        nameWithOwner,
        description,
        commits: commits.filter((commit: any) => commit !== null),
      };
    })
    .filter((repo: any) => repo.commits && repo.commits.length > 0);

  const parsedPullRequests: PullRequest[] =
    commitData.user.pullRequests.nodes.map((pr) => {
      return {
        title: pr.title,
        body: pr.body,
        createdAt: new Date(pr.createdAt).toLocaleString("zh-CN"),
        repository: {
          nameWithOwner: pr.repository.nameWithOwner,
          description: pr.repository.description,
        },
      };
    });

  const parsedData = {
    username: login,
    name: commitData.user.name,
    bio: commitData.user.bio,
    location: commitData.user.location,
    status: commitData.user.status,
    pullRequests: parsedPullRequests,
    repositoriesContributedTo: parsedCommits,
    profileContent: profileContent,
  };

  // Save to cache before returning
  await saveUserDataToCache(login, parsedData);

  return parsedData;
}

function parseUserData(data: UserData): string {
  const {
    username,
    name,
    bio,
    location,
    status,
    pullRequests,
    repositoriesContributedTo,
    profileContent,
  } = data;

  return `用户名: ${username}
昵称: ${name}
简介: ${bio}
位置: ${location}
状态: ${status?.emoji || "无状态"} ${status?.message || "无状态信息"}
PR 记录: 
<START_PULL_REQUESTS>
${
  pullRequests
    ?.map(
      (pr) =>
        `- ${pr.title} (${pr.repository.nameWithOwner})\n  ${pr.body}\n  创建于: ${pr.createdAt}`
    )
    .join("\n") || "无 PR 记录"
}
<END_PULL_REQUESTS>
Commit 记录: 
<START_COMMITS>
${
  repositoriesContributedTo
    ?.map(
      (repo) =>
        `- ${repo.nameWithOwner} (${repo.description})\n  提交记录:\n  ${
          repo?.commits
            ?.map((commit) => `- ${commit.message} (${commit.committedDate})`)
            .join("\n") || "无 Commit 记录"
        }`
    )
    .join("\n") || "无 Commit 记录"
}
<END_COMMITS>
个人资料内容: 
<START_PROFILE_CONTENT>
${profileContent || "无个人资料页"}
<END_PROFILE_CONTENT>`;
}

// Function to generate a hash key from commit data and preset
function generateReportKey(login: string, presetKey: string): string {
  return `${presetKey}:${login}`;
}

// Get report from Redis
async function getReport(key: string): Promise<string | null> {
  try {
    return await redisClient.get(`report:${key}`);
  } catch (err) {
    console.error("Redis get error:", err);
    return null;
  }
}

// Save report to Redis
async function saveReport(key: string, report: string): Promise<void> {
  try {
    await redisClient.set(`report:${key}`, report);
    // Set expiration to 30 days (in seconds)
    await redisClient.expire(`report:${key}`, 60 * 60 * 24 * 30);
  } catch (err) {
    console.error("Redis save error:", err);
  }
}

// Check if a report generation is already pending
async function isReportGenerationPending(key: string): Promise<boolean> {
  try {
    const status = await redisClient.get(`pending:${key}`);
    return status === "1";
  } catch (err) {
    console.error("Redis check pending status error:", err);
    return false;
  }
}

// Mark a report generation as pending
async function setReportGenerationPending(key: string): Promise<void> {
  try {
    await redisClient.set(`pending:${key}`, "1");
    // Set expiration to 10 minutes to avoid orphaned pending statuses
    await redisClient.expire(`pending:${key}`, 10 * 60);
  } catch (err) {
    console.error("Redis set pending status error:", err);
  }
}

// Clear the pending status of a report generation
async function clearReportGenerationPending(key: string): Promise<void> {
  try {
    await redisClient.del(`pending:${key}`);
  } catch (err) {
    console.error("Redis clear pending status error:", err);
  }
}

export async function fetchUserDataEndpoint(req: BunRequest) {
  const sessionId = req.cookies.get("session");
  if (sessionId === null) {
    return Response.json(
      {
        state: "Failed",
        message: "Invalid session ID.",
      },
      {
        status: 401,
      }
    );
  }
  const session = await sessionStore.getSession(sessionId);
  if (session === null) {
    return Response.json(
      {
        state: "Failed",
        message: "Invalid session ID.",
      },
      {
        status: 401,
      }
    );
  }
  const octokit = createOctokitFromSession(session);

  const rawData = await fetchUserData(octokit);
  const parsedData = parseUserData(rawData);
  return Response.json({
    state: "Success",
    raw: rawData,
    parsed: parsedData,
  });
}

export async function generateReport(req: BunRequest) {
  const sessionId = req.cookies.get("session");
  if (sessionId === null) {
    return Response.json(
      {
        state: "Failed",
        message: "Invalid session ID.",
      },
      {
        status: 401,
      }
    );
  }
  const session = await sessionStore.getSession(sessionId);
  if (session === null) {
    return Response.json(
      {
        state: "Failed",
        message: "Invalid session ID.",
      },
      {
        status: 401,
      }
    );
  }

  // Get preset key from URL search params
  const url = new URL(req.url);
  const presetKey = url.searchParams.get("preset") || "man_page";
  const forceRegen = url.searchParams.get("force_regen") === "true";

  if (!presets[presetKey]) {
    return Response.json(
      {
        state: "Failed",
        message: `Preset '${presetKey}' not found.`,
      },
      {
        status: 400,
      }
    );
  }

  // Generate a unique key for this report that includes the preset
  const reportKey = generateReportKey(session?.login, presetKey);

  // Set up Server-Sent Events response
  const stream = new ReadableStream({
    start(controller) {
      // Helper function to send SSE events
      const sendEvent = (eventType: string, data: any) => {
        controller.enqueue(
          `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
        );
      };

      // Self-invoking async function to handle the report generation process
      (async () => {
        try {
          sendEvent("status", { message: "Checking for cached report..." });

          // If force_regen is true, delete any existing report
          if (forceRegen) {
            try {
              await redisClient.del(`report:${reportKey}`);
              sendEvent("status", {
                message: "Forced regeneration, cleared cache.",
              });
            } catch (err) {
              console.error("Error deleting cached report:", err);
              sendEvent("generate_error", {
                message: "服务器出现错误，请稍后再试。",
              });
            }
          }

          // Check if we already have a report for this data
          const existingReport = await getReport(reportKey);
          if (existingReport && !forceRegen) {
            console.log("Returning cached report");
            sendEvent("complete", { message: existingReport });
            controller.close();
            return;
          }

          // Check if a report is already being generated for this data
          if (await isReportGenerationPending(reportKey)) {
            sendEvent("generate_error", {
              message: "报告正在生成中，请等待上次生成结束后再试。",
            });
            controller.close();
            return;
          }

          // Mark this report as pending
          await setReportGenerationPending(reportKey);

          // Get the prompt from presets
          const initialPrompt = presets[presetKey].prompt;
          if (!initialPrompt) {
            await clearReportGenerationPending(reportKey);
            sendEvent("generate_error", {
              message: `Preset '${presetKey}' not found.`,
            });
            controller.close();
            return;
          }

          sendEvent("status", { message: "正在获取 GitHub 数据..." });
          const octokit = createOctokitFromSession(session);
          const rawData = await fetchUserData(octokit);
          const parsedData = parseUserData(rawData);

          sendEvent("status", { message: "正在进行深度思考..." });

          // Check if streaming is enabled (default to true)
          const streamingEnabled = url.searchParams.get("stream") !== "false";
          let reportContent = "";

          if (rawData.username === null) {
            await clearReportGenerationPending(reportKey);
            sendEvent("generate_error", {
              message: `服务器出错，请稍后再试。`,
            });
            controller.close();
            return;
          }

          const stream = await openai.chat.completions.create({
            messages: [
              {
                role: "system",
                content: initialPrompt
                  .replace("{{commit_data}}", parsedData)
                  .replace("{{username}}", rawData.username),
              },
            ],
            model: process.env.OPENAI_MODEL || "deepseek-chat",
            stream: true,
          });

          // Process the stream
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              reportContent += content;
              // Send incremental updates to the client
              sendEvent("chunk", { content });
            }
          }

          console.log("Streaming report generation completed");

          if (reportContent) {
            sendEvent("status", { message: "正在保存..." });
            await saveReport(reportKey, reportContent);
          }

          // Remove the pending status
          await clearReportGenerationPending(reportKey);

          // Send the final report content
          sendEvent("complete", { message: reportContent });
          controller.close();
        } catch (error) {
          console.error("Error generating report:", error);
          await clearReportGenerationPending(reportKey);

          // Do not send event on stream close
          if (
            !(error instanceof TypeError) ||
            controller instanceof ReadableStreamDefaultController
          ) {
            try {
              // sendEvent("generate_error", {
              //   message: "服务器繁忙，请稍后再试。",
              // });
              controller.close();
            } catch (err) {
              console.error("Error closing stream:", err);
            }
          }
        }
      })();
    },
    cancel() {
      console.log("Report generation cancelled");
      // Async function in sync context, must be handled properly
      clearReportGenerationPending(reportKey).catch(err => 
        console.error("Error clearing pending status on cancel:", err)
      );
    },
  });

  // Return the SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function getPresets(req: BunRequest) {
  return Response.json({
    presets: Object.entries(presets).map(([key, value]) => ({
      name: key,
      description: value.description,
    })),
  });
}
