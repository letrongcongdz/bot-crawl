import dotenv from "dotenv";
import { MezonClient, type ChannelMessageContent } from "mezon-sdk";
import cron from "node-cron";
import { AppDataSource } from "../data-source.js";
import { CompanyThread } from "../entities/CompanyThread.js";
import { runCrawlerAndSave } from "../services/CrawlerService.ts";

dotenv.config();

export async function startBot(): Promise<void> {
  const token = process.env.APPLICATION_TOKEN;
  if (!token) {
    throw new Error("APPLICATION_TOKEN is not set in .env");
  }

  const client = new MezonClient(token);
  await client.login();

  console.log("Bot started with cron job!");

  async function postMessages() {
    try {
      const companyRepo = AppDataSource.getRepository(CompanyThread);
      const companies = await companyRepo.find({
        relations: ["posts", "posts.replies"],
      });

      const clan = await client.clans.fetch("1966443581044428800");
      const allChannels = Array.from(clan.channels.values());

      for (const company of companies) {
        // const channel = allChannels.find((ch) => ch.name === company.name);
        const channel = await client.channels.fetch("1967931150504562688");
        if (!channel) {
          console.log(`Channel for ${company.name} not found`);
          continue;
        }

        if (company.posts.length === 0) {
          console.log(`No posts for ${company.name}`);
          continue;
        }

        const post = company.posts[0];

        await channel.send({
          t: `**${post?.reviewer}**: ${post?.content}`,
          isCard: true,
        } as ChannelMessageContent);

        console.log(`One post for ${company.name} sent successfully!`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in cron job:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  }

  await runCrawlerAndSave();

  await postMessages();

  const schedule_send_message = process.env.CRON_SCHEDULE_SEND_MSG || "*/30 * * * *";
  cron.schedule(schedule_send_message, async () => {
    console.log("Running cron job: posting messages...");
    await postMessages();
  });

  const schedule_crawl = process.env.CRON_SCHEDULE_CRAWL || "0 8,14,23 * * *";
  cron.schedule(schedule_crawl, async () => {
    console.log("Running cron job: crawl...");
    await runCrawlerAndSave();
  });
}
