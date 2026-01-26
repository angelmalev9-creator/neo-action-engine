import { Page, Frame } from "playwright";

export type IframeMode =
  | "none"
  | "same-origin"
  | "cross-origin-readable"
  | "cross-origin-blocked";

export interface IframeScanResult {
  hasIframe: boolean;
  mode: IframeMode;
  iframeCount: number;
  accessibleFrames: number;
  blockedFrames: number;
  iframeSources: string[];
  sandboxed: boolean;
  providerHint: string | null;
}

export async function iframeScan(page: Page): Promise<IframeScanResult> {
  const frames = page.frames();
  const mainFrame = page.mainFrame();

  let iframeCount = 0;
  let accessibleFrames = 0;
  let blockedFrames = 0;
  let sandboxed = false;

  const iframeSources: string[] = [];
  let providerHint: string | null = null;

  for (const frame of frames) {
    if (frame === mainFrame) continue;

    iframeCount++;
    const url = frame.url();
    iframeSources.push(url);

    // crude provider detection (heuristic, not magic)
    if (/cloudbeds/i.test(url)) providerHint = "cloudbeds";
    else if (/littlehotelier/i.test(url)) providerHint = "littlehotelier";
    else if (/hotelrunner/i.test(url)) providerHint = "hotelrunner";
    else if (/booking|airbnb|agoda/i.test(url)) providerHint = "blocked-platform";

    // try to touch DOM
    try {
      await frame.evaluate(() => document.body !== null);
      accessibleFrames++;
    } catch {
      blockedFrames++;
    }
  }

  // detect sandboxed iframes from DOM
  sandboxed = await page.evaluate(() => {
    const iframes = Array.from(document.querySelectorAll("iframe"));
    return iframes.some((i) => {
      const sb = i.getAttribute("sandbox");
      return sb !== null && !sb.includes("allow-same-origin");
    });
  });

  let mode: IframeMode = "none";

  if (iframeCount === 0) {
    mode = "none";
  } else if (accessibleFrames > 0 && blockedFrames === 0) {
    mode = "same-origin";
  } else if (accessibleFrames > 0 && blockedFrames > 0) {
    mode = "cross-origin-readable";
  } else {
    mode = "cross-origin-blocked";
  }

  return {
    hasIframe: iframeCount > 0,
    mode,
    iframeCount,
    accessibleFrames,
    blockedFrames,
    iframeSources,
    sandboxed,
    providerHint,
  };
}
