import { describe, it, expect } from "vitest";
import { validateFiles, validateFile, formatFileSize, getAcceptString } from "../validation";
import type { ValidationRule } from "../types";

const PDF_RULE: ValidationRule = {
  acceptedTypes: ["application/pdf", ".pdf"],
  acceptedFormats: ["PDF"],
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxFiles: 5,
  minFiles: 1,
};

const IMAGE_RULE: ValidationRule = {
  acceptedTypes: ["image/jpeg", "image/png", ".jpg", ".png"],
  acceptedFormats: ["JPG", "PNG"],
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 10,
  minFiles: 1,
};

function makeFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("validateFiles", () => {
  it("returns valid for a single correct PDF", () => {
    const file = makeFile("doc.pdf", 1024, "application/pdf");
    const result = validateFiles([file], PDF_RULE);
    expect(result.valid).toBe(true);
  });

  it("rejects empty file list", () => {
    const result = validateFiles([], PDF_RULE);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].code).toBe("TOO_FEW_FILES");
    }
  });

  it("rejects when below minFiles", () => {
    const rule: ValidationRule = { ...PDF_RULE, minFiles: 2 };
    const file = makeFile("doc.pdf", 1024, "application/pdf");
    const result = validateFiles([file], rule);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].code).toBe("TOO_FEW_FILES");
    }
  });

  it("rejects when above maxFiles", () => {
    const files = Array.from({ length: 6 }, (_, i) =>
      makeFile(`doc${i}.pdf`, 1024, "application/pdf"),
    );
    const result = validateFiles(files, PDF_RULE);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].code).toBe("TOO_MANY_FILES");
    }
  });

  it("rejects invalid file type", () => {
    const file = makeFile("image.png", 1024, "image/png");
    const result = validateFiles([file], PDF_RULE);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].code).toBe("INVALID_TYPE");
      expect(result.errors[0].fileName).toBe("image.png");
    }
  });

  it("rejects file exceeding size limit", () => {
    const file = makeFile("huge.pdf", 20 * 1024 * 1024, "application/pdf");
    const result = validateFiles([file], PDF_RULE);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].code).toBe("FILE_TOO_LARGE");
    }
  });

  it("rejects empty (zero-byte) files", () => {
    const file = makeFile("empty.pdf", 0, "application/pdf");
    const result = validateFiles([file], PDF_RULE);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].code).toBe("EMPTY_FILE");
    }
  });

  it("accepts images with image rule", () => {
    const jpg = makeFile("photo.jpg", 2048, "image/jpeg");
    const png = makeFile("icon.png", 1024, "image/png");
    const result = validateFiles([jpg, png], IMAGE_RULE);
    expect(result.valid).toBe(true);
  });

  it("matches by file extension when MIME is empty", () => {
    // Browsers sometimes return empty MIME for certain files
    const file = makeFile("doc.pdf", 1024, "");
    const result = validateFiles([file], PDF_RULE);
    expect(result.valid).toBe(true);
  });

  it("reports multiple errors for multiple bad files", () => {
    const tooLarge = makeFile("big.pdf", 20 * 1024 * 1024, "application/pdf");
    const wrongType = makeFile("photo.jpg", 1024, "image/jpeg");
    const result = validateFiles([tooLarge, wrongType], PDF_RULE);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBe(2);
    }
  });
});

describe("validateFile (single)", () => {
  it("validates a single file against rules", () => {
    const file = makeFile("test.pdf", 500, "application/pdf");
    const result = validateFile(file, PDF_RULE);
    expect(result.valid).toBe(true);
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1048576)).toBe("1.0 MB");
    expect(formatFileSize(1572864)).toBe("1.5 MB");
  });
});

describe("getAcceptString", () => {
  it("joins accepted types with commas", () => {
    expect(getAcceptString(PDF_RULE)).toBe("application/pdf,.pdf");
    expect(getAcceptString(IMAGE_RULE)).toBe("image/jpeg,image/png,.jpg,.png");
  });
});
