import React from 'react';
import { formatReportSections } from '../../utils/reportUtils';

interface ReportFormatterProps {
  report: string | null;
}

const ReportFormatter: React.FC<ReportFormatterProps> = ({ report }) => {
  if (!report) return null;

  const sections = formatReportSections(report);
  
  return (
    <>
      {sections.map((section, index) => (
        <div key={index} className="mb-6">
          {section.title && (
            <h3 className="text-lg font-mono font-bold text-primary mb-2">
              {section.title}
            </h3>
          )}
          {section.content.length > 0 && (
            <div className="font-mono text-sm whitespace-pre-wrap pl-4 border-l-2 border-primary/20">
              {section.content.map((line, i) => {
                // Check if line starts with common prefixes to apply styling
                if (
                  line.trim().startsWith("-") ||
                  line.trim().startsWith("•")
                ) {
                  return (
                    <p key={i} className="mb-1 text-accent-foreground">
                      {line}
                    </p>
                  );
                } else if (
                  line.trim().startsWith("BUGS") ||
                  line.trim().startsWith("DIAGNOSTICS")
                ) {
                  return (
                    <p key={i} className="mb-1 font-bold text-destructive">
                      {line}
                    </p>
                  );
                } else {
                  return (
                    <p key={i} className="mb-1">
                      {line}
                    </p>
                  );
                }
              })}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default ReportFormatter;
