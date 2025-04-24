import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";

interface CallbackProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Callback = ({ setIsAuthenticated }: CallbackProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (!code) {
      setError("No code provided by GitHub");
      return;
    }

    const authenticateWithGitHub = async () => {
      try {
        const response = await fetch(`/api/code?code=${code}`, {
          method: 'GET',
          credentials: 'include', // Important to include cookies
        });
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.statusText}`);
        }
        
        // Set authentication state to true
        setIsAuthenticated(true);
        
        // Redirect to dashboard or home page
        navigate("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };
    
    authenticateWithGitHub();
  }, [searchParams, navigate, setIsAuthenticated]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-background to-background/80">
        <Card className="w-[380px] border-destructive/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>授权失败</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-4">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/login")}>
              返回登录页面
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/80">
      <Card className="w-[380px] border shadow-md">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="relative mb-6">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div className="absolute inset-0 h-10 w-10 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
          </div>
          <h3 className="text-xl font-medium mb-2">正在授权访问 GitHub 数据</h3>
          <p className="text-sm text-muted-foreground">请稍等，我们正在登录...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Callback;
