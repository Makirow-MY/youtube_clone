import { APP_URL } from "@/constants";
import { Client } from "@upstash/workflow";

const workflow = new Client({
   // baseUrl: "https://qstash-us-east-1.upstash.io",
    token: process.env.QSTASH_TOKEN!
 })

const { workflowRunId } = await  workflow.trigger({
  url: `${APP_URL}/api/videos/workflow/title`,
  retries: 3
});

