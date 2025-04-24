import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Github } from "lucide-react";

const Login = () => {
  const handleGithubLogin = () => {
    const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
    const redirectUri = `${window.location.origin}/callback`;
    const scope = "user repo";

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-primary/5 rounded-full -translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl"></div>
      </div>

      <Card className="w-[400px] mx-6 border shadow-lg relative z-10 overflow-hidden">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Github className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <CardTitle className="text-2xl">GitHub 锐评</CardTitle>
            <CardDescription>让 AI 锐评一下你都在做什么吧</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGithubLogin}
            className="w-full py-4 h-auto text-base flex gap-2 shadow-sm hover:shadow transition-all"
          >
            <Github size={20} />
            GitHub 登录
          </Button>
        </CardContent>
        <CardFooter className="px-8 pb-6 flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground text-center w-full mt-1">
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
