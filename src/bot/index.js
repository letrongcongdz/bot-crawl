import dotenv from "dotenv";
import fetch from "node-fetch";
import { MezonClient } from "mezon-sdk";

dotenv.config();

async function main() {
  const client = new MezonClient(process.env.APPLICATION_TOKEN);
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
      const companies = await companiesRes.json();

      const company = companies.find((c) => c.name === channelName);
      if (!company) return;

      console.log(`Posting for company: ${company.name}`);

      const postsRes = await fetch(`${process.env.API_BASE_URL}/api/companies/${company.id}`);
      const companyData = await postsRes.json();

      for (const post of companyData.posts) {
        await channel.send({
          t: `**${post.reviewer}**: ${post.content}`,
          isCard: true
        });

        // for (const reply of post.replies) {
        //   await cardMsg.reply({
        //     t: `**${reply.reviewer}**: ${reply.content}`,
        //   });
        // }
      }

      console.log(`All posts for ${company.name} sent successfully!`);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
}

main().then(() => console.log("Bot started!")).catch(console.error);
