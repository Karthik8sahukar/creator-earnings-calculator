import { describe, it, expect } from "vitest";
import { suggestOutputName, formatBytes } from "../download";

describe("suggestOutputName", () => {
  it("generates name from single file", () => {
    const files = [new File([""], "report.pdf", { type: "application/pdf" })];
    const name = suggestOutputName("merge-pdf", files);
    expect(name).toBe("report-merge-pdf.pdf");
  });

  it("generates generic name for multiple files", () => {
    const files = [
      new File([""], "a.pdf", { type: "application/pdf" }),
      new File([""], "b.pdf", { type: "application/pdf" }),
    ];
    const name = suggestOutputName("merge-pdf", files);
    expect(name).toBe("merge-pdf-output.pdf");
  });

  it("uses custom extension", () => {
    const files = [new File([""], "photo.pdf", { type: "application/pdf" })];
    const name = suggestOutputName("pdf-to-jpg", files, "jpg");
    expect(name).toBe("photo-pdf-to-jpg.jpg");
  });
});

describe("formatBytes", () => {
  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats KB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("formats MB", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
  });

  it("formats fractional values", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});
