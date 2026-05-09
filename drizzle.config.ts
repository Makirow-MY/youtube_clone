 import dotenv from "dotenv"
 import {defineConfig} from "drizzle-kit"

 dotenv.config({path: ".env.local"})

 export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: "postgresql://postgres:Makiapassword123.@localhost:5433/postgres"
    }
 })