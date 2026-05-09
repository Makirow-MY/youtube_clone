import {drizzle } from 'drizzle-orm/postgres-js'
import postgres from "postgres";
import * as schema from "./schema";   // ← THIS WAS MISSING

const queryClient = postgres(process.env.DATABASE_URL!);

export const db = drizzle(queryClient, { schema });