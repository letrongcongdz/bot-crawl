import puppeteer from "puppeteer";
import { CompanyThreadService } from "./CompanyThreadlService.ts";
import { CompanyThreadDTO } from "../dtos/CompanyThreadDTO.ts";
import { PostDTO } from "../dtos/PostDTO.ts";
import { ReplyDTO } from "../dtos/ReplyDTO.ts";

const baseUrl = "https://congtytui.me";
const service = new CompanyThreadService();

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function autoScroll(page: puppeteer.Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function clickLoadMore(page: puppeteer.Page) {
  let moreBtn = await page.$(".fake-loadmore span");
  while (moreBtn) {
    try {
      await Promise.all([
        page.waitForResponse(() => true, { timeout: 5000 }).catch(() => {}),
        moreBtn.click(),
      ]);
      await delay(1000);
      moreBtn = await page.$(".fake-loadmore span");
    } catch {
      break;
    }
  }
}

/**
 * Crawl all posts + comments + replies of a company
 */
async function crawlCompany(browser: puppeteer.Browser, companyUrl: string): Promise<CompanyThreadDTO | null> {
  const posts: PostDTO[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  let companyName = "Unknown";

  try {
    while (hasNextPage) {
      const page = await browser.newPage();
      const url = companyUrl + (currentPage > 1 ? `?page=${currentPage}` : "");
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

      await autoScroll(page);
      await clickLoadMore(page);


      if (currentPage === 1) {
        try {
          await page.waitForSelector("h1.product-title", { timeout: 5000 });
          companyName = await page.$eval("h1.product-title", el => el.textContent?.trim() || "Unknown");
        } catch {
          console.warn(`Cannot get company name at: ${url}`);
        }
      }

      const commentItems = await page.$$(".item.section-box");
      for (const item of commentItems) {
        await item.evaluate(el => el.scrollIntoView({ behavior: "smooth", block: "center" }));
        await delay(300);

        const moreBtn = await item.$(".readmore-link");
        if (moreBtn) {
          try { await moreBtn.click(); await delay(400); } catch {}
        }

        const reviewer = await item.$eval(".item-title a", el => el.textContent?.trim()).catch(() => "Anonymous");
        const content = await item.$eval(".item-body p", el => el.textContent?.trim()).catch(() => "");
        const postElementId = await item.evaluate(el => el.id);
        const originId = postElementId?.replace("review-", "") || "";

        const replies: ReplyDTO[] = [];
        const replyItems = await item.$$(".cmt-item-wrapper .cmt-item");
        for (const replyItem of replyItems) {
          const replyAuthor = await replyItem.$eval(".cmt-title", el => el.textContent?.trim()).catch(() => "Anonymous");
          const replyContent = await replyItem.$eval(".cmt-content p", el => el.textContent?.trim()).catch(() => "");
          const replyId = await replyItem.evaluate(el => el.id);
          const replyOriginId = replyId?.replace("comment-replies-", "") || "";
          replies.push({ reviewer: replyAuthor, content: replyContent, replyOriginId });
        }

        posts.push({ reviewer, content, originId, replies });
      }

      const nextLink = await page.$('ul.pagination li a[rel="next"]');
      hasNextPage = !!nextLink;
      currentPage++;

      await page.close();
    }

    return { name: companyName, posts };
  } catch (err) {
    console.error(`Error when crawling company: ${companyUrl}`, err);
    return null;
  }
}

export async function runCrawlerAndSave(concurrency: number = 5) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true,
    slowMo: 20,
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  let currentPage = 101;
  const maxPage = 200;
  let hasNextPage = true;

  while (hasNextPage && currentPage <= maxPage) {
    const url = baseUrl + `?page=${currentPage}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector("h3.product-title a", { timeout: 20000 });
    const companyLinks = await page.$$eval("h3.product-title a", links =>
      links.map(link => (link as HTMLAnchorElement).href).filter(Boolean)
    );

    console.log(`Found ${companyLinks.length} companies on page ${currentPage}`);

    const queue = [...companyLinks];
    let running = 0;

    const runNext = async (): Promise<void> => {
      if (queue.length === 0) return;
      const link = queue.shift()!;
      running++;

      console.log(`[RUNNING: ${running}] [QUEUE LEFT: ${queue.length}] -> ${link}`);

      try {
        const companyDTO = await crawlCompany(browser, link);
        if (companyDTO) {
          await service.save(companyDTO);
          console.log(`Saved ${companyDTO.posts.length} posts for company: ${companyDTO.name}`);
        }
      } catch (err) {
        console.error(`Error crawling ${link}`, err);
      } finally {
        running--;
        await delay(500);
        if (queue.length > 0) {
          runNext();
        }
      }
    };

    const starters = [];
    for (let i = 0; i < concurrency && i < queue.length; i++) {
      starters.push(runNext());
    }

    while (queue.length > 0 || running > 0) {
      console.log(`Progress => Running: ${running}, Queue left: ${queue.length}`);
      await delay(40000);
    }

    console.log(`Done crawling all companies on page ${currentPage}`);

    const nextLink = await page.$('ul.pagination li a[rel="next"]');
    hasNextPage = !!nextLink && currentPage < maxPage;
    currentPage++;
  }

  await browser.close();
}
