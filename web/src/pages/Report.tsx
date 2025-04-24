import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "../components/ui/card";
import ReportLoading from "../components/report/ReportLoading";
import ReportError from "../components/report/ReportError";
import ReportHeader from "../components/report/ReportHeader";
import ReportContent from "../components/report/ReportContent";
import ReportActions from "../components/report/ReportActions";
import { generateReportImage } from "../components/report/imageGenerator";

interface Preset {
  name: string;
  description: string;
}

const Report = () => {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isPresetLoaded, setIsPresetLoaded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Parse preset from URL query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const presetParam = queryParams.get("preset");
    if (presetParam) {
      setSelectedPreset(presetParam);
    }
    setIsPresetLoaded(true);
  }, [location.search]);

  // Fetch presets
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch("/api/presets");
        if (response.ok) {
          const data = await response.json();
          setPresets(data.presets || []);
        }
      } catch (err) {
        console.error("Error fetching presets:", err);
      }
    };

    fetchPresets();
  }, []);

  // Fetch report with the selected preset
  useEffect(() => {
    // Only fetch the report once preset information is loaded from URL
    if (!isPresetLoaded) return;

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setReport("");
        setStatusMessage("准备生成报告...");

        const url = selectedPreset
          ? `/api/report?preset=${encodeURIComponent(selectedPreset)}`
          : "/api/report";

        setIsStreaming(true);

        const eventSource = new EventSource(
          url + (url.includes("?") ? "&" : "?") + "stream=true",
          {
            withCredentials: true,
          }
        );

        // Handle different event types
        eventSource.addEventListener("chunk", (event) => {
          try {
            const data = JSON.parse(event.data);
            setReport((prev) => (prev || "") + data.content);
          } catch (err) {
            console.log(err);
            // If it's not valid JSON, treat it as plain text
            setReport((prev) => (prev || "") + event.data);
          }
        });

        eventSource.addEventListener("status", (event) => {
          try {
            const data = JSON.parse(event.data);
            setStatusMessage(data.message);
          } catch (err) {
            console.error("Error parsing status message:", err);
          }
        });

        eventSource.addEventListener("complete", (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.message) {
              setReport(data.message);
            }
            setStatusMessage("报告生成完成");
            setTimeout(() => setStatusMessage(null), 3000);
          } catch (err) {
            console.error("Error parsing complete message:", err);
          } finally {
            eventSource.close();
            setIsStreaming(false);
            setIsLoading(false);
          }
        });

        eventSource.addEventListener("generate_error", (event) => {
          try {
            const data = JSON.parse(event.data);
            setErrorMessage(data.message || "服务器繁忙，请稍后再试。");
          } catch (err) {
            console.error("Error while generation:", err);
          } finally {
            eventSource.close();
            setIsStreaming(false);
            setIsLoading(false);
            setStatusMessage(null);
          }
        });

        eventSource.onerror = () => {
          // Close the connection on error
          eventSource.close();
          setIsStreaming(false);
          setIsLoading(false);
          setStatusMessage(null);
        };

        // Cleanup function to close SSE connection when component unmounts
        return () => {
          eventSource.close();
        };
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(
          err instanceof Error ? err.message : "Failed to generate report"
        );
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [selectedPreset, isPresetLoaded]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    // Update URL to reflect preset change
    navigate(`/report?preset=${encodeURIComponent(value)}`, { replace: true });
  };

  // Function to handle report regeneration
  const handleRegenerateReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setReport("");
      setStatusMessage("准备重新生成报告...");

      const url = selectedPreset
        ? `/api/report?preset=${encodeURIComponent(
            selectedPreset
          )}&force_regen=true`
        : "/api/report?force_regen=true";

      // Check if the browser supports EventSource
      if (typeof EventSource !== "undefined") {
        setIsStreaming(true);

        const eventSource = new EventSource(url + "&stream=true", {
          withCredentials: true,
        });

        // Handle different event types
        eventSource.addEventListener("chunk", (event) => {
          try {
            const data = JSON.parse(event.data);
            setReport((prev) => (prev || "") + data.content);
          } catch (err) {
            console.log(err);
            // If it's not valid JSON, treat it as plain text
            setReport((prev) => (prev || "") + event.data);
          }
        });

        eventSource.addEventListener("status", (event) => {
          try {
            const data = JSON.parse(event.data);
            setStatusMessage(data.message);
          } catch (err) {
            console.error("Error parsing status message:", err);
          }
        });

        eventSource.addEventListener("complete", (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.message) {
              setReport(data.message);
            }
            setStatusMessage("报告重新生成完成");
            setTimeout(() => setStatusMessage(null), 3000);
          } catch (err) {
            console.error("Error parsing complete message:", err);
          } finally {
            eventSource.close();
            setIsStreaming(false);
            setIsLoading(false);
          }
        });

        eventSource.addEventListener("generate_error", (event) => {
          try {
            const data = JSON.parse(event.data);
            setErrorMessage(data.message || "服务器繁忙，请稍后再试。");
          } catch (err) {
            console.error("Error while generation:", err);
          } finally {
            eventSource.close();
            setIsStreaming(false);
            setIsLoading(false);
            setStatusMessage(null);
          }
        });

        eventSource.onerror = () => {
          // Close the connection on error
          eventSource.close();
          setErrorMessage("服务器繁忙，请稍后再试。");
          setIsStreaming(false);
          setIsLoading(false);
          setStatusMessage(null);
        };
      } else {
        // Fallback to traditional fetch
        const response = await fetch(url, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Report regeneration failed: ${response.statusText}`);
        }

        const data = await response.json();
        setReport(data.message);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error regenerating report:", err);
      setError(
        err instanceof Error ? err.message : "Failed to regenerate report"
      );
      setIsLoading(false);
    }
  };

  // Function to handle image generation
  const handleGenerateImage = async () => {
    try {
      setIsLoading(true);

      if (!report) {
        throw new Error("No report data available");
      }

      await generateReportImage(report, selectedPreset, presets);
    } catch (err) {
      console.error("Error generating image:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !report) {
    return <ReportLoading />;
  }

  if (error) {
    return (
      <ReportError
        error={error}
        onBackToDashboard={handleBackToDashboard}
        onRetry={handleRegenerateReport}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 pb-10">
      {/* Add pt-16 for padding top to avoid overlap with fixed theme toggle */}
      <div>
        <ReportHeader
          presets={presets}
          selectedPreset={selectedPreset}
          onPresetChange={handlePresetChange}
          onBackToDashboard={handleBackToDashboard}
        />

        <div className="my-6 px-2 container mx-auto flex justify-center">
          <Card className="overflow-hidden border shadow-lg max-w-3xl">
            <ReportContent
              report={report}
              isStreaming={isStreaming}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
            />

            <ReportActions
              isLoading={isLoading}
              hasReport={Boolean(report)}
              onBackToDashboard={handleBackToDashboard}
              onRegenerateReport={handleRegenerateReport}
              onGenerateImage={handleGenerateImage}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Report;
