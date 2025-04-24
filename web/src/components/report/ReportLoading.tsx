import { Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

const ReportLoading = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-background to-background/80">
      <div className="text-center max-w-md px-4">
        <Card className="border shadow-md overflow-hidden">
          <CardContent className="pt-10 pb-8 flex flex-col items-center">
            <div className="relative mb-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 h-16 w-16 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
            </div>
            <div className="mb-6 space-y-4 text-center">
              <h2 className="text-xl font-semibold">正在生成 GitHub 报告</h2>
            </div>
            <div className="space-y-4 w-full">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full animate-pulse rounded-full"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                正在分析你的 GitHub 数据，这可能需要约 10 秒...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportLoading;
