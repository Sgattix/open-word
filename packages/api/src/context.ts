import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { auth } from "@OpenWord/auth";
import db from "@OpenWord/db";
import { fromNodeHeaders } from "better-auth/node";

export async function createContext(opts: CreateExpressContextOptions) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(opts.req.headers),
  });
  return {
    session,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
