import dotenv from "dotenv";
import { MezonClient, type ChannelMessageAck, type ChannelMessageContent } from "mezon-sdk";
import cron from "node-cron";
import { AppDataSource } from "../data-source.js";
import { CompanyThread } from "../entities/CompanyThread.js";
import { Post } from "../entities/Post.js";
import type { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel.js";
import { startCrawlCronJob } from "../CronJob.ts";

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

      // Filter companies that have a corresponding channel
      const companiesWithChannel = companies.filter((company) =>
        allChannels.some((ch) => ch.name === company.name)
      );

      if (companiesWithChannel.length === 0) {
        console.log("No companies with channels found.");
        return;
      }

      // Random 1 company
      const randomCompany = companiesWithChannel[Math.floor(Math.random() * companiesWithChannel.length)];
      const channel = allChannels.find((ch) => ch.name === randomCompany?.name)!;

      console.log(`Random company selected: ${randomCompany?.name}`);

      // Filter unsent posts
      const unsentPosts: Post[] = randomCompany?.posts.filter((p) => !p.isSent) ?? [];
      if (unsentPosts?.length === 0) {
        console.log(`No unsent posts for ${randomCompany?.name}`);
        return;
      }

      // Random 1 post
      const randomPost = unsentPosts[Math.floor(Math.random() * unsentPosts.length)] as Post;
      console.log(`Sending random post for ${randomCompany?.name}: ${randomPost.id}`);

      await channel.send(
        {
          t: randomPost.content,
          isCard: true,
        } as ChannelMessageContent,
        undefined, // mentions
        undefined, // attachments
        false,     // mention_everyone
        true       // anonymous_message
      ) as ChannelMessageAck;

      randomPost.isSent = true;
      await postRepo.save(randomPost);

      console.log(`Post for ${randomCompany?.name} sent successfully!`);
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

  await startCrawlCronJob();
}
