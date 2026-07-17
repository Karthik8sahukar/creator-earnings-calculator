/**
 * Public error type shared between the server-only YouTube service and
 * the route helpers. Kept in a standalone module so it can be imported
 * from anywhere (including tests) without pulling in `server-only`.
 */
export class YouTubeApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "YouTubeApiError";
    this.status = status;
    this.code = code;
  }
}
