export type UserStatus = {
  emoji: string | null;
  message: string | null;
};

export type Commit = {
  message: string | null;
  committedDate: string;
}

export type Repository = {
  commits: Commit[] | null;
  description: string | null;
  nameWithOwner: string;
}

export type PullRequest = {
  createdAt: string;
  body: string | null;
  title: string | null;
  repository: Omit<Repository, 'commits'>;
}

export type UserData = {
  username: string | null;
  name: string | null;
  bio: string | null;
  location: string | null;
  status: UserStatus | null;
  pullRequests: PullRequest[] | null;
  repositoriesContributedTo: Repository[] | null;
  profileContent: string | null;
};
