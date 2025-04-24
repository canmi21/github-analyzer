import { Loader2 } from "lucide-react";
import { CardContent } from "../../components/ui/card";
import ReportFormatter from "./ReportFormatter";

interface ReportContentProps {
  report: string | null;
  isStreaming: boolean;
  statusMessage: string | null;
  errorMessage?: string | null;
}

const ReportContent = ({
  report,
  isStreaming,
  statusMessage,
  errorMessage,
}: ReportContentProps) => {
  return (
    <CardContent className="p-4">
      {report ? (
        <div className="font-mono text-sm bg-card/50 rounded-lg p-6 border shadow-inner overflow-x-auto report-container">
          <ReportFormatter report={report} />
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          {errorMessage || "服务器繁忙，请稍后再试。"}
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center w-full mt-4">
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

      {/* Status and loading indicator */}
      {(isStreaming || statusMessage) && (
        <div className="flex items-center justify-center mt-4 p-2 bg-primary/5 rounded-md">
          <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {statusMessage || "正在接收数据..."}
          </span>
        </div>
      )}
    </CardContent>
  );
};

export default ReportContent;
