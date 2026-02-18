import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { functions } from "@/inngest/functions";

// Create an API route to serve Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
