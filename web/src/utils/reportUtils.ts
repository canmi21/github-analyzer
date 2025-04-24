export interface FormattedSection {
  title: string;
  content: string[];
}

export const formatReportSections = (text: string): FormattedSection[] => {
  if (!text) return [];

  // Split the report by lines first
  const lines = text.split("\n");
  const sections: FormattedSection[] = [];
  let currentSection: FormattedSection | null = null;

  // Process each line to organize into sections
  lines.forEach((line) => {
    // Check if this is a section title (starts with ">>")
    if (line.trim().startsWith(">>")) {
      // If we have a current section, add it to our sections array
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start a new section with this title
      currentSection = {
        title: line.trim().substring(2).trim(), // Remove ">>" prefix and trim
        content: [],
      };
    }
    // Otherwise this is content for the current section
    else if (currentSection) {
      currentSection.content.push(line);
    }
    // If we encounter content before any title, create a default section
    else {
      currentSection = {
        title: "",
        content: [line],
      };
    }
  });

  // Add the last section if it exists
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};
