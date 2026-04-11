import { env } from "@OpenWord/env/server";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../prisma/generated/client";
export type {
  Game,
  User,
  Session,
  Account,
  Verification,
} from "../prisma/generated/client";

const databaseUrl: string = env.DATABASE_URL;
const url: URL = new URL(databaseUrl);
const connectionConfig = {
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
};

const adapter = new PrismaMariaDb(connectionConfig);
const prisma = new PrismaClient({ adapter });

export default prisma;
