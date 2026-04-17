export const PREMIUM_TEMPLATE_URLS: Record<string, string> = {
  database: "https://nexuslabzen.gumroad.com/l/ijuvn",
  auth: "https://nexuslabzen.gumroad.com/l/dghzas",
  "api-proxy": "https://nexuslabzen.gumroad.com/l/bktllv",
};

export const PREMIUM_TEMPLATE_NAMES = Object.keys(PREMIUM_TEMPLATE_URLS);

export function getPremiumUrl(template: string): string | undefined {
  return PREMIUM_TEMPLATE_URLS[template];
}
