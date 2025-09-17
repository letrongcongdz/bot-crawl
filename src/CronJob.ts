import cron from 'node-cron';
import { runCrawlerAndSave } from './services/CrawlerService.ts';

export function startCronJob() {
    const schedule = process.env.CRON_SCHEDULE || "0 8,14,23 * * *";
    cron.schedule(
        schedule,
        async () => {
            const now = new Date();
            console.log(`[CRON] Triggered at: ${now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`);
            console.log("Running the crawler at 8h, 14h, 23h every day...");

            try {
                await runCrawlerAndSave();
                console.log("Crawler run completed.");
            } catch (error) { 
                console.error("Error running the crawler:", error);
            }
        },
        {
            timezone: "Asia/Ho_Chi_Minh",
        }
    );
}