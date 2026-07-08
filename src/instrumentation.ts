export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const secret = process.env.AUTH_SECRET;
    const placeholders = new Set(["", "change-me-in-production", "change-me-to-a-random-secret"]);
    if (process.env.NODE_ENV === "production" && (!secret || placeholders.has(secret))) {
      console.error("FATAL: AUTH_SECRET must be set to a secure random value in production.");
      console.error("Set AUTH_SECRET in CapRover → App Configs → Environment Variables.");
      process.exit(1);
    }

    const { migrate } = await import("./lib/db/migrate");
    await migrate();
  }
}
