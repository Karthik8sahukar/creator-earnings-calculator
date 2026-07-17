import { vi, type MockInstance } from "vitest";

export { redact, summarizeHeaders } from "../logger";

/**
 * Small helper that captures console output while a test runs and
 * gives you flat arrays of the serialized calls to inspect.
 */
export class ConsoleSpy {
  log: string[] = [];
  warn: string[] = [];
  error: string[] = [];
  private readonly logSpy: MockInstance;
  private readonly warnSpy: MockInstance;
  private readonly errorSpy: MockInstance;

  constructor() {
    this.logSpy = vi
      .spyOn(console, "log")
      .mockImplementation((...args) => {
        this.log.push(args.map(String).join(" "));
      });
    this.warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation((...args) => {
        this.warn.push(args.map(String).join(" "));
      });
    this.errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args) => {
        this.error.push(args.map(String).join(" "));
      });
  }

  restore(): void {
    this.logSpy.mockRestore();
    this.warnSpy.mockRestore();
    this.errorSpy.mockRestore();
  }
}
