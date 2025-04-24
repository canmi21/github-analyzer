import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { CardFooter } from "../../components/ui/card";

interface ReportActionsProps {
  isLoading: boolean;
  hasReport: boolean;
  onBackToDashboard: () => void;
  onRegenerateReport: () => void;
  onGenerateImage: () => void;
}

const ReportActions = ({
  isLoading,
  hasReport,
  onBackToDashboard,
  onRegenerateReport,
  onGenerateImage,
}: ReportActionsProps) => {
  return (
    <CardFooter className="flex flex-wrap justify-center gap-3 px-6 py-4 border-t bg-primary/5">
      <Button onClick={onBackToDashboard} variant="outline">
        返回仪表盘
      </Button>
      <Button
        onClick={onRegenerateReport}
        variant="default"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            重新生成中...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            重新生成
          </>
        )}
      </Button>
      <Button
        onClick={onGenerateImage}
        variant="secondary"
        disabled={isLoading || !hasReport}
      >
        生成分享图片
      </Button>
    </CardFooter>
  );
};

export default ReportActions;
