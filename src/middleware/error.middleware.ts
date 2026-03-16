import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: any,
  res: Response,
  _next: NextFunction,
) {
  req.log?.error(
    {
      err,
      path: req.originalUrl,
      method: req.method,
      requestId: req.headers["x-request-id"] ?? null,
    },
    "request failed",
  );

  res.status(500).json({
    ok: false,
    error: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? undefined
        : String(err?.message ?? err),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    ok: false,
    error: "ROUTE_NOT_FOUND",
    path: req.originalUrl,
  });
}
