import type { Request } from "express";

export type AuthUser = {
  id: string;
  role: "user" | "admin";
};

export type AuthedRequest = Request & {
  user?: AuthUser;
};
