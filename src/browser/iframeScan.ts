import { Page } from "playwright";

export type IframeMode =
  | "none"
  | "same-origin"
  | "cross-origin-readable";

export interface IframeScanResult {
  hasIframe: boolean;
  mode: IframeMode;
  blocked: boolean;
  iframeCount: number;
  accessibleFrames: number;
  iframeSources: string[];
  providerHint: string | null;
}

export async function iframeScan(page: Page): Promise<IframeScanResult> {
  const frames = page.frames();
  const mainFrame = page.mainFrame();

  let iframeCount = 0;
  let accessibleFrames = 0;
  let blockedFrames = 0;

  const iframeSources: string[] = [];
  let providerHint: string | null = null;

  for (const frame of frames) {
    if (frame === mainFrame) continue;

    iframeCount++;
    const url = frame.url();
    iframeSources.push(url);

    // provider detection (heuristic)
    if (/cloudbeds/i.test(url)) providerHint = "cloudbeds";
    else if (/littlehotelier/i.test(url)) providerHint = "littlehotelier";
    else if (/hotelrunner/i.test(url)) providerHint = "hotelrunner";
    else if (/clock-?pms|clocksoftware|wbe\.clock/i.test(url)) providerHint = "clock-pms";
    else if (/booking|airbnb|agoda/i.test(url)) providerHint = "blocked-platform";

    // DOM accessibility test
    try {
      await frame.evaluate(() => document.body !== null);
      accessibleFrames++;
    } catch {
      blockedFrames++;
    }
  }

  const hasIframe = iframeCount > 0;
  const blocked = hasIframe && accessibleFrames === 0;

  let mode: IframeMode = "none";

  if (!hasIframe) {
    mode = "none";
  } else if (!blocked && blockedFrames === 0) {
    mode = "same-origin";
  } else {
    mode = "cross-origin-readable";
  }

  return {
    hasIframe,
    mode,
    blocked,
    iframeCount,
    accessibleFrames,
    iframeSources,
    providerHint
  };
}
