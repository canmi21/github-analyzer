import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import {
  Users,
  Code,
  BarChartHorizontal,
  Loader2,
  MapPin,
  Briefcase,
  Globe,
  LogOut,
  Calendar,
  PersonStanding,
  Notebook,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// GitHub user interface based on the API response
interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  notification_email: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

// Preset interface for report generation
interface Preset {
  name: string;
  description: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch user data
        const userResponse = await fetch("/api/user");
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user data: ${userResponse.status}`);
        }
        const userData = await userResponse.json();
        setUserData(userData);

        // Fetch presets
        const presetsResponse = await fetch("/api/presets");
        if (presetsResponse.ok) {
          const presetsData = await presetsResponse.json();
          setPresets(presetsData.presets || []);
          if (presetsData.presets && presetsData.presets.length > 0) {
            setSelectedPreset(presetsData.presets[0].name);
          }
        }
      } catch (err) {
        document.cookie =
          "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    document.cookie =
      "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  };

  const handleGenerateReport = () => {
    navigate(`/report${selectedPreset ? `?preset=${selectedPreset}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <div className="absolute inset-0 h-16 w-16 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
          </div>
          <p className="mt-6 text-xl font-medium">正在加载 GitHub 信息...</p>
          <p className="text-muted-foreground mt-2">
            请稍等，我们正在获取您的数据
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background to-background/95">
      {/* Top navbar */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="container p-2 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm"
          >
            <LogOut className="h-3 w-3" />
            <span>退出登录</span>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
        {/* Header with profile information */}
        <div className="my-4 sm:my-6">
          <div className="flex flex-row gap-3 items-center">
            {userData?.avatar_url && (
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/40 blur-lg opacity-30 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src={userData.avatar_url}
                  alt={`${userData.login}的头像`}
                  className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 border-background shadow-lg object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="space-y-0 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {userData?.name || userData?.login || "GitHub 用户"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  @{userData?.login}
                </p>

                {userData?.created_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 text-primary/70" />
                    <span>
                      加入于{" "}
                      {new Date(userData.created_at).toLocaleDateString(
                        "zh-CN",
                        {
                          year: "numeric",
                          month: "short",
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>

              {userData?.bio && (
                <div className="mb-2">
                  <p className="text-xs sm:text-sm line-clamp-2 sm:line-clamp-none max-w-3xl">
                    {userData.bio}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {userData?.company && (
                  <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Briefcase className="h-3 w-3 text-primary" />
                    <span>{userData.company}</span>
                  </div>
                )}
                {userData?.location && (
                  <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>{userData.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {[
            {
              title: "仓库",
              value: userData?.public_repos.toString() || "0",
              icon: <Code className="h-4 w-4" />,
              color:
                "border-blue-200 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent",
            },
            {
              title: "关注者",
              value: userData?.followers.toString() || "0",
              icon: <Users className="h-4 w-4" />,
              color:
                "border-green-200 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent",
            },
            {
              title: "关注",
              value: userData?.following.toString() || "0",
              icon: <PersonStanding className="h-4 w-4" />,
              color:
                "border-yellow-200 bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-950/20 dark:to-transparent",
            },
            {
              title: "Gist 数量",
              value: userData?.public_gists.toString() || "0",
              icon: <Notebook className="h-4 w-4" />,
              color:
                "border-red-200 bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20 dark:to-transparent",
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className={`border overflow-hidden transition-all hover:shadow-sm hover:-translate-y-0.5 ${stat.color}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-xs text-muted-foreground">
                      {stat.title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <p className="text-lg font-bold">{stat.value}</p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-full bg-background/80 shadow-sm border">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Links row */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mb-6 px-2">
          {userData?.blog && (
            <a
              href={
                userData.blog.startsWith("http")
                  ? userData.blog
                  : `https://${userData.blog}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary hover:underline underline-offset-2 transition-colors"
            >
              <Globe className="h-3 w-3 text-primary" />
              <span>
                {userData.blog.replace(/(https?:\/\/)?(www\.)?/i, "")}
              </span>
            </a>
          )}
          {userData?.html_url && (
            <a
              href={userData.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary hover:underline underline-offset-2 transition-colors"
            >
              <Code className="h-3 w-3 text-primary" />
              <span>GitHub 个人页面</span>
            </a>
          )}
        </div>

        {/* Generate Report Section */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-lg overflow-hidden border shadow-md mb-6">
          {/* Decorative elements - simplified */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>

          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="p-2 rounded-full bg-primary/10 mb-2">
                <BarChartHorizontal className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                GitHub AI 锐评
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                锐评一下你都在 GitHub 写了什么。
              </p>
            </div>

            <p className="text-sm text-muted-foreground text-center w-full mt-1 mb-4">
              Powered by
              <a
                href="https://www.bingyan.net/"
                className="text-[#F5AB3D] underline"
                target="_blank"
              >
                <img
                  src="/by-logo.png"
                  alt="Logo"
                  className="inline-block h-6 w-6 ms-1"
                />
                BingyanStudio
              </a>
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              {presets.length > 0 && (
                <div className="mb-3 sm:mb-0">
                  <Select
                    value={selectedPreset}
                    onValueChange={setSelectedPreset}
                  >
                    <SelectTrigger className="w-[180px] bg-background/60 backdrop-blur-sm">
                      <SelectValue placeholder="选择报告类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {presets.map((preset) => (
                          <SelectItem key={preset.name} value={preset.name}>
                            {preset.description}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleGenerateReport}
                className="px-4 py-2 h-auto text-sm font-medium shadow-sm hover:shadow-md transition-all"
              >
                <BarChartHorizontal className="mr-2 h-4 w-4" />
                生成报告
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
