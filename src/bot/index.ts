import dotenv from "dotenv";
import fetch from "node-fetch";
import { MezonClient, type ChannelMessageContent } from "mezon-sdk";

dotenv.config();

export interface Reply {
  id: number;
  reviewer: string;
  content: string;
  replyOriginId: string;
}

export interface Post {
  id: number;
  reviewer: string;
  content: string;
  originId: string;
  replies: Reply[];
}

export interface CompanyData {
  id: number;
  name: string;
  posts: Post[];
}

export async function startBot(): Promise<void> {
  const token = process.env.APPLICATION_TOKEN;
  if (!token) {
    throw new Error("APPLICATION_TOKEN is not set in .env");
  }

  const client = new MezonClient(token);
  await client.login();

  const botId = client.clientId;

  client.onChannelMessage(async (event) => {
    try {
      if (event.sender_id === botId) return;
      if (event.content?.t !== "!post") return;

      const channel = await client.channels.fetch(event.channel_id);
      const channelName = channel.name;
      if (!channelName) return;

      const companiesRes = await fetch(`${process.env.API_BASE_URL}/api/companies/`);
      const companies = await companiesRes.json() as Pick<CompanyData, "id" | "name">[];

      const company = companies.find((c) => c.name === channelName);
      if (!company) return;

      console.log(`Posting for company: ${company.name}`);

      const postsRes = await fetch(`${process.env.API_BASE_URL}/api/companies/${company.id}`);
      const companyData = await postsRes.json() as CompanyData;

      for (const post of companyData.posts) {
        const cardMsg = await channel.send({
          t: `**${post.reviewer}**: ${post.content}`,
          isCard: true,
        } as ChannelMessageContent);
      }

      console.log(`All posts for ${company.name} sent successfully!`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error handling message:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  });

  console.log("Bot started!");
}
