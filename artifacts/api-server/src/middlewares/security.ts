export function configuredOrigins(): string[] {
  const origins = (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean);
  for (const host of [
    process.env.REPLIT_DEV_DOMAIN,
    process.env.REPLIT_EXPO_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS ?? "").split(","),
  ]) if (host) origins.push(`https://${host}`);
  return origins.flatMap((value) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === "https:" || url.protocol === "http:" ? [url.origin] : [];
    } catch { return []; }
  });
}
