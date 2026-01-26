type SiteRecord = {
  domain: string;
  submitSelector?: string;
  confirmationSignal?: string;
  paymentRequired?: boolean;
};

const memory = new Map<string, SiteRecord>();

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

export function getSiteMemory(url: string): SiteRecord | null {
  const domain = getDomain(url);
  return memory.get(domain) || null;
}

export function saveSiteMemory(
  url: string,
  data: Partial<SiteRecord>
) {
  const domain = getDomain(url);
  const existing = memory.get(domain) || { domain };
  memory.set(domain, { ...existing, ...data });
}
