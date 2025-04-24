import { ArrowLeft, Terminal } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface Preset {
  name: string;
  description: string;
}

interface ReportHeaderProps {
  presets: Preset[];
  selectedPreset: string;
  onPresetChange: (value: string) => void;
  onBackToDashboard: () => void;
}

const ReportHeader = ({
  presets,
  selectedPreset,
  onPresetChange,
  onBackToDashboard,
}: ReportHeaderProps) => {
  return (
    <>
      <div className="bg-background/80 backdrop-blur-sm py-2 border-b px-2">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onBackToDashboard}
            className="text-muted-foreground hover:text-foreground w-20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h1 className="text-lg font-bold">GitHub 锐评报告</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="bg-primary/5 p-6 border-b">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Terminal className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-center text-xl md:text-2xl mb-1 font-semibold">
          GitHub 锐评结果
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          基于你的 GitHub 活动生成的命令行风格报告
        </p>

        {/* Preset selector */}
        {presets.length > 0 && (
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2">
              <Select
                value={selectedPreset}
                onValueChange={onPresetChange}
              >
                <SelectTrigger className="w-[180px] bg-background/60">
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
          </div>
        )}
      </div>
    </>
  );
};

export default ReportHeader;
