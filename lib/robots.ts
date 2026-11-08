import robotsParser from 'robots-parser';

const USER_AGENT = 'SiteScreenshotTool/1.0 (+local dev tool)';

/**
 * Fetch and parse robots.txt for a given origin URL.
 * Returns an object with helper methods.
 * If robots.txt is not found or fetch fails, returns a permissive fallback.
 */
export async function fetchRobotsTxt(origin: string): Promise<{
  isAllowed: (url: string) => boolean;
  getCrawlDelay: () => number;
}> {
  const robotsUrl = `${origin}/robots.txt`;

  const permissiveFallback = {
    isAllowed: () => true,
    getCrawlDelay: () => 300,
  };

  let robotsTxtContent: string;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return permissiveFallback;
    }

    robotsTxtContent = await response.text();
  } catch {
    return permissiveFallback;
  }

  const robots = robotsParser(robotsUrl, robotsTxtContent);

  return {
    isAllowed: (url: string): boolean => {
      return robots.isAllowed(url, USER_AGENT) ?? true;
    },
    getCrawlDelay: (): number => {
      const delaySeconds = robots.getCrawlDelay(USER_AGENT);
      if (delaySeconds != null && delaySeconds > 0) {
        return delaySeconds * 1000;
      }
      return 300;
    },
  };
}
