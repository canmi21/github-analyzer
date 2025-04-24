import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

interface ReportErrorProps {
  error: string;
  onBackToDashboard: () => void;
  onRetry: () => void;
}

const ReportError = ({ error, onBackToDashboard, onRetry }: ReportErrorProps) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-background to-background/80">
      <Card className="w-[380px] border-destructive/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>报告生成失败</CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-4">
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Button onClick={onBackToDashboard}>返回仪表盘</Button>
          <Button onClick={onRetry} variant="outline">
            重试
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReportError;
