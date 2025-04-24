import { formatReportSections } from "@/utils/reportUtils";
import QRCode from "qrcode";

interface Preset {
  name: string;
  description: string;
}

// Helper function to wrap text
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  // Check if the text contains any Chinese characters
  const containsChinese = /[\u4e00-\u9fa5]/.test(text);
  const punctuation = [
    ".",
    ",",
    "!",
    "?",
    ";",
    ":",
    "。",
    "！",
    "，",
    "、",
    "；",
    "：",
  ];

  const lines: string[] = [];
  let currentLine = "";

  if (containsChinese) {
    // For Chinese text, wrap character by character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== "") {
        if (punctuation.includes(char)) {
          currentLine += text[i];
          lines.push(testLine);
          currentLine = "";
        } else {
          lines.push(currentLine);
          currentLine = char;
        }
      } else {
        currentLine = testLine;
      }
    }
  } else {
    // For non-Chinese text, wrap word by word
    const words = text.split(" ");

    for (const word of words) {
      const separator = currentLine === "" ? "" : " ";
      const testLine = currentLine + separator + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== "") {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Filter out empty lines
  return lines.filter((line) => line.trim() !== "");
};

// Helper function to generate QR code directly in the browser
const generateQRCodeInBrowser = async (
  text: string,
  size: number
): Promise<ImageData> => {
  // Create a temporary canvas for the QR code with transparency
  const qrCanvas = document.createElement("canvas");
  qrCanvas.width = size;
  qrCanvas.height = size;
  const qrCtx = qrCanvas.getContext("2d");

  if (!qrCtx) {
    throw new Error("Could not get QR canvas context");
  }

  // Generate QR code with transparent background
  await QRCode.toCanvas(qrCanvas, text, {
    width: size,
    margin: 1,
    color: {
      dark: "#00000000",
      light: "#aaaaaa",
    },
  });

  // Return the image data
  return qrCtx.getImageData(0, 0, size, size);
};

// Helper function to load an image and return a promise
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const generateReportImage = async (
  report: string,
  selectedPreset: string,
  presets: Preset[]
) => {
  // Create a temporary canvas *only* for initial height estimation if needed,
  // but prefer direct calculation if possible.
  // Let's refine the calculation without a temp canvas first.

  // Parse and format the report
  const sections = formatReportSections(report);

  // --- Constants ---
  const width = 1000;
  const contentWidth = width - 180; // Increased margin for larger text
  const textLineHeight = 42; // Further increased from 36
  const titleLineHeight = 50; // Further increased from 42
  const headerBaseHeight = 240; // Increased for larger title text
  const sectionTitleSpacing = { before: 20, after: 0 }; // Increased spacing
  const sectionSpacing = 20; // Increased from 15
  const finalPadding = 240; // Increased for larger promo text

  // --- Create the actual canvas for drawing and measurement ---
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  canvas.width = width; // Set width first

  // --- Calculate height dynamically during a "dry run" render pass ---
  let calculatedHeight = headerBaseHeight;
  ctx.textAlign = "left"; // Set for measurement consistency

  sections.forEach((section) => {
    if (section.title) {
      calculatedHeight += sectionTitleSpacing.before;
      ctx.font = "bold 32px sans-serif";
      // Title itself - assume one line for calculation simplicity here
      calculatedHeight += titleLineHeight;
      calculatedHeight += sectionTitleSpacing.after;
    }

    ctx.font = "26px sans-serif";
    const contentLinesRaw = section.content.filter((line) => line.trim());
    contentLinesRaw.forEach((rawLine) => {
      const wrappedLines = wrapText(ctx, rawLine, contentWidth);
      calculatedHeight += wrappedLines.length * textLineHeight;
    });

    calculatedHeight += sectionSpacing; // Add space after content block
  });

  calculatedHeight += finalPadding; // Add final bottom padding with space for promo

  // Ensure minimum height
  const height = Math.max(750, calculatedHeight); // Increased minimum height
  canvas.height = height; // Now set the calculated height

  // --- Drawing starts here ---
  // (Re-apply settings as canvas state might reset on resize)

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#1a1b26");
  gradient.addColorStop(1, "#16161e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add decorative elements (accent circles)
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.beginPath();
  ctx.arc(100, 100, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(132, 94, 194, 0.05)";
  ctx.beginPath();
  ctx.arc(width - 100, height - 100, 200, 0, Math.PI * 2);
  ctx.fill();

  // Title
  ctx.font = "bold 64px system-ui, sans-serif"; // Increased from 56px
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("GitHub 锐评报告", width / 2, 140);

  // Subtitle - show preset if available
  const presetText = selectedPreset
    ? presets.find((p) => p.name === selectedPreset)?.description ||
      selectedPreset
    : "个人 GitHub 分析";
  ctx.font = "36px system-ui, sans-serif"; // Increased from 32px
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(presetText, width / 2, 200);

  // Report content
  ctx.textAlign = "left"; // Reset alignment for content

  // Render all sections
  let y = headerBaseHeight; // Start drawing below the header area

  for (const section of sections) {
    if (section.title) {
      y += sectionTitleSpacing.before;
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#B191E4"; // Primary color
      ctx.fillText(`${section.title}`, 90, y); // Slightly increased x position
      y += titleLineHeight; // Move y down by title line height
      y += sectionTitleSpacing.after;
    }

    ctx.font = "26px sans-serif";
    const contentLinesRaw = section.content.filter((line) => line.trim());
    for (const rawLine of contentLinesRaw) {
      // Style based on content (apply before wrapping)
      const trimmedLine = rawLine.trim();
      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("•")) {
        ctx.fillStyle = "#61afef"; // Blue for list items
      } else {
        ctx.fillStyle = "#ffffff"; // Default white
      }

      // Wrap text using the drawing context and render
      const wrappedLines = wrapText(ctx, rawLine, contentWidth);
      for (const wrappedLine of wrappedLines) {
        ctx.fillText(wrappedLine, 90, y); // Slightly increased x position
        y += textLineHeight; // Increment y for each rendered line
      }
    }
    y += sectionSpacing; // Add space after content block
  }

  // Add promotion section at the bottom
  try {
    // Define QR code size and position with more space
    const qrSize = 160; // Increased from 150
    const padding = 40; // Increased from 55
    const promoAreaHeight = 240; // Increased from 200

    // Draw a subtle separator line
    // const separatorY = height - promoAreaHeight - padding + 10;
    // ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    // ctx.lineWidth = 1;
    // ctx.beginPath();
    // ctx.moveTo(80, separatorY);
    // ctx.lineTo(width - 80, separatorY);
    // ctx.stroke();

    // Calculate positions for QR code and text with better spacing
    const qrX = 40; // Adjusted x position
    const qrY = height - qrSize - padding;

    // Generate and draw QR code in one clean sequence
    const qrCodeData = await generateQRCodeInBrowser(
      "https://gitbox.hust.online",
      qrSize
    );
    const qrBitmap = await createImageBitmap(qrCodeData);
    ctx.drawImage(qrBitmap, qrX, qrY, qrSize, qrSize);

    // Improved text positioning and rendering
    const textX = 60 + qrSize; // Slightly increased x position
    const titleY = height - qrSize - padding + 45;
    const subtitleY = titleY + 45;

    // Draw title
    ctx.font = "bold 34px system-ui, sans-serif"; // Increased from 30px
    ctx.fillStyle = "#B191E4"; // Darker purple
    ctx.textAlign = "left";
    ctx.fillText("探索你的 GitHub 分析:", textX, titleY);

    // Draw URL with better contrast and size
    ctx.font = "30px system-ui, sans-serif"; // Increased from 26px
    ctx.fillStyle = "#aaaaaa";

    // Use a brighter color for the URL to make it stand out
    const promoText = "GitHub 锐评生成器";
    ctx.fillText(promoText, textX, subtitleY);

    // URL in a different color for visual separation
    ctx.fillStyle = "#61afef"; // Light blue for URL to stand out
    const urlText = "https://gitbox.hust.online";
    ctx.fillText(urlText, textX, subtitleY + 45); // Increased spacing

    // Draw "BingyanStudio" text
    const studioText = "BingyanStudio";
    ctx.font = "bold 36px system-ui, sans-serif"; // Increased from 20px
    ctx.fillStyle = "rgba(245, 171, 61, 0.9)";
    const studioWidth = ctx.measureText(studioText).width;
    const studioX = width - 40 - studioWidth;
    const studioY = subtitleY + 45;
    ctx.fillText(studioText, studioX, studioY);

    // Add "Powered by BingyanStudio" text with logo
    ctx.font = "20px system-ui, sans-serif"; // Increased from 18px
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const poweredByText = "Powered by";
    // const poweredByWidth = ctx.measureText(poweredByText).width;
    const poweredByX = studioX - 40 // width - 40 - poweredByWidth; // Adjusted for new margins
    const poweredByY = subtitleY; // Adjusted for larger text
    ctx.fillText(poweredByText, poweredByX, poweredByY);

    // Save context state before drawing logo
    ctx.save();

    try {
      // Load and draw the actual logo instead of a circle
      const logoImg = await loadImage("/by-logo.png");
      const logoSize = 44; // Increased from 32
      const logoX = studioX - logoSize - 2;
      const logoY = studioY - 35; // Adjusted for larger logo
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error(
        "Failed to load Bingyan logo, falling back to text only:",
        error
      );
      // Adjust text position if logo fails to load
      // ctx.fillText(studioText, poweredByX + poweredByWidth + 5, poweredByY);
    }

    // Add border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, width - 80, height - promoAreaHeight - padding);

    // Restore context state
    ctx.restore();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  } catch (error) {
    console.error("Failed to add promotion section:", error);
  }

  // Convert to image and download
  const image = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = image;
  link.download = `github-report-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
