export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function assertFound<T>(value: T | null | undefined, message = "Not found"): T {
  if (value === null || value === undefined) {
    throw new AppError(404, message);
  }
  return value;
}
