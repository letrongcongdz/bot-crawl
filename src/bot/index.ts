import dotenv from "dotenv";
import { MezonClient, type ChannelMessageAck, type ChannelMessageContent } from "mezon-sdk";
import cron from "node-cron";
import { AppDataSource } from "../data-source.js";
import { CompanyThread } from "../entities/CompanyThread.js";
import { Post } from "../entities/Post.js";
import { runCrawlerAndSave } from "../services/CrawlerService.ts";
import type { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel.js";

dotenv.config();

export async function startBot(): Promise<void> {
  const token = process.env.APPLICATION_TOKEN;
  if (!token) {
    throw new Error("APPLICATION_TOKEN is not set in .env");
  }

  const client = new MezonClient(token);
  await client.login();

  console.log("Bot started with cron job!");
  const allChannels: TextChannel[] = [];

  client.onChannelMessage(async (event) => {
    // console.log("Channel message received:", event);

    // const channelsArray = [client.channels.values()];
    // const channelIds = channelsArray.map(channel => channel.id);

    if (event.mentions?.some((m) => m.user_id === client.clientId)) {
      const channel = await client.channels.fetch(event.channel_id);
      if (channel && !allChannels.some((c) => c.id === channel.id)) {
        allChannels.push(channel as TextChannel);
        console.log(`Saved channel: ${channel.name} (${channel.id})`);
      }
    }
  });



  async function postMessages() {
    try {
      const companyRepo = AppDataSource.getRepository(CompanyThread);
      const postRepo = AppDataSource.getRepository(Post);

      const companies = await companyRepo.find({
        relations: ["posts", "posts.replies"],
      });

      for (const company of companies) {
        const channel = allChannels.find((ch) => ch.name === company.name);
        if (!channel) {
          console.log(`Channel for ${company.name} not found`);
          continue;
        }

        const post = company.posts.find((p) => !p.isSent);
        if (!post) {
          console.log(`No new posts for ${company.name}`);
          continue;
        }

        await channel.send(
          {
            t: `${post.content}`,
            isCard: true,
          } as ChannelMessageContent,
          undefined, // mentions
          undefined, // attachments
          false,     // mention_everyone
          true       // anonymous_message
        ) as ChannelMessageAck;

        post.isSent = true;
        await postRepo.save(post);

        console.log(`Post for ${company.name} sent successfully!`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in cron job:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  }

  const schedule_send_message = process.env.CRON_SCHEDULE_SEND_MSG || "*/30 * * * *";
  cron.schedule(schedule_send_message, async () => {
    console.log("Running cron job: posting messages...");
    await postMessages();
  });
}
