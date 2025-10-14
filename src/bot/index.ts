import dotenv from "dotenv";
import { MezonClient, type ChannelMessageAck, type ChannelMessageContent } from "mezon-sdk";
import cron from "node-cron";
import { AppDataSource } from "../data-source.js";
import { CompanyThread } from "../entities/CompanyThread.js";
import { Post } from "../entities/Post.js";
import type { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel.js";
import { startCrawlCronJob } from "../CronJob.ts";
import { formatInterval } from "./formatInterval.ts";

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

  // Keep track of daily plan
  let dailyCompanyPlan: CompanyThread[] = [];
  let currentCompanyIndex = 0;
  let currentRound = 0; // round = 0..2 (3 rounds)
  let lastPreparedDate: string | undefined = undefined; // check Date (YYYY-MM-DD)
  let planCompletedToday = false;

  // Calculate interval between messages
  let totalMessages = 0;
  let intervalMinutes = 0;
  // const START_HOUR = parseInt(process.env.CRON_SEND_MSG_START_HOUR || "8");
  // const END_HOUR = parseInt(process.env.CRON_SEND_MSG_END_HOUR || "18");
  function parseTime(str: string | undefined, fallbackHour: number, fallbackMinute: number) {
    if (!str) return { hour: fallbackHour, minute: fallbackMinute };
    const parts = str.split(":").map(Number);
    return {
      hour: parts[0] ?? fallbackHour,
      minute: parts[1] ?? fallbackMinute,
    };
  }
  const { hour: START_HOUR, minute: START_MIN } = parseTime(process.env.CRON_SEND_MSG_START, 8, 0);
  const { hour: END_HOUR, minute: END_MIN } = parseTime(process.env.CRON_SEND_MSG_END, 18, 0);


  async function prepareDailyPlan() {
    console.log("Preparing daily plan...");
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (lastPreparedDate === today && planCompletedToday) {
      console.log("Daily plan was already completed earlier today. Skipping prepare.");
      return;
    }

    const companyRepo = AppDataSource.getRepository(CompanyThread);

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

    // Shuffle companies
    const shuffled = companiesWithChannel.sort(() => Math.random() - 0.5);

    // Pick 2/3 companies
    const numToPick = Math.ceil((2 / 3) * shuffled.length);
    dailyCompanyPlan = shuffled.slice(0, numToPick);
    console.log('Companies selected for today:', dailyCompanyPlan.map(c => c.name));

    currentCompanyIndex = 0;
    currentRound = 0;
    lastPreparedDate = today;
    planCompletedToday = false;

    totalMessages = dailyCompanyPlan.length * 3;
    const totalSeconds =
      (new Date().setHours(END_HOUR, END_MIN, 0, 0) - new Date().setHours(START_HOUR, START_MIN, 0, 0)) / 1000;
    const rawInterval = totalSeconds / totalMessages;
    intervalMinutes = Math.floor(rawInterval / 60);

    console.log(
      `Prepared daily plan for ${today}: ${dailyCompanyPlan.length}/${companiesWithChannel.length} companies selected.  Total messages: ${totalMessages}, interval: ${formatInterval(intervalMinutes)}`
    );
  }

  async function postMessages() {
    try {
      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), START_HOUR, START_MIN);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), END_HOUR, END_MIN);

      if (now < startTime || now >= endTime) {
        console.log("Current time is outside of sending window. Skipping.");
        return;
      }

      // // Prepare plan if nothing prepared yet for today
      // if (dailyCompanyPlan.length === 0) {
      //   await prepareDailyPlan();
      // }

      if (dailyCompanyPlan.length === 0) {
        console.log("No companies available in plan.");
        return;
      }

      console.log("Running cron job: posting messages...");

      // Select company in round-robin style
      const company = dailyCompanyPlan[currentCompanyIndex] as CompanyThread;
      const channel = allChannels.find((ch) => ch.name === company.name);
      if (!channel) {
        console.log(`Channel for ${company.name} not found`);

        currentCompanyIndex++;

        if (currentCompanyIndex >= dailyCompanyPlan.length) {
          currentCompanyIndex = 0;
          currentRound++;
        }

        if (currentRound >= 3) {
          console.log("Finished 3 rounds for all companies today.");
          dailyCompanyPlan = [];
          currentRound = 0;
          currentCompanyIndex = 0;
          planCompletedToday = true;
        }
        return;
      }

      // Filter unsent posts
      const unsentPosts: Post[] = company.posts.filter((p) => !p.isSent);
      if (unsentPosts.length === 0) {
        console.log(`No unsent posts for ${company.name}`);
      } else {
        // Random 1 post
        const randomPost =
          unsentPosts[Math.floor(Math.random() * unsentPosts.length)] as Post;

        console.log(
          `Sending random post for ${company.name} (Round ${currentRound + 1}): ${randomPost.id}`
        );

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
        await AppDataSource.getRepository(Post).save(randomPost);

        console.log(`Post for ${company.name} sent successfully!`);
      }

      // Update indices for next cron
      currentCompanyIndex++;

      if (currentCompanyIndex >= dailyCompanyPlan.length) {
        currentCompanyIndex = 0;
        currentRound++;
      }

      if (currentRound >= 3) {
        console.log("Finished 3 rounds for all companies today.");
        dailyCompanyPlan = [];
        currentRound = 0;
        currentCompanyIndex = 0;
        planCompletedToday = true;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in cron job:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  }

  // const schedule_send_message = process.env.CRON_SCHEDULE_SEND_MSG || "* * * * *";
  // After prepareDailyPlan()
  let prepareMinute = START_MIN - 10;
  let prepareHour = START_HOUR;

  if (prepareMinute < 0) {
    prepareMinute += 60;
    prepareHour -= 1;
  }

  if (prepareHour < 0) {
    prepareHour = 23;
  }

  const cronTime = `${prepareMinute} ${prepareHour} * * *`;

  cron.schedule(cronTime, async () => {
    console.log(`⏰ Preparing daily plan 10 minutes before start time (${prepareHour}:${prepareMinute.toString().padStart(2, "0")})`);
    await prepareDailyPlan();
  });



  if (intervalMinutes <= 0) {
    console.warn("⚠️ Interval not ready yet. Retrying plan in 1 minutes...");
    setTimeout(async () => {
      await prepareDailyPlan();
      if (intervalMinutes > 0) {
        console.log(`🚀 Starting message posting every ${formatInterval(intervalMinutes)}...`);
        setInterval(async () => {
          await postMessages();
        }, intervalMinutes * 60 * 1000);
      }
    }, 1 * 60 * 1000);
    return;
  }

  await startCrawlCronJob();

}
