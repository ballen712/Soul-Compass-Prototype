import { Router } from "express";
import { ProfileCreateSchema, ProfileUpdateSchema } from "@workspace/api-zod";
import { supabaseProfiles, type ProfileService, type Principal } from "./service";

export function createProfileRouter(service: ProfileService = supabaseProfiles) {
  const router = Router();
  router.use(async (req, res, next) => {
    const header = req.get("authorization") ?? "";
    if (!/^Bearer [A-Za-z0-9._~-]{20,8192}$/.test(header)) {
      res.status(401).json({ error: "Sign in to access your account." }); return;
    }
    try {
      const token = header.slice(7);
      const user = await service.authenticate(token);
      if (!user) { res.status(401).json({ error: "Your session expired. Please sign in again." }); return; }
      res.locals.account = { token, user };
      next();
    } catch { res.status(503).json({ error: "Account service is unavailable. Please retry." }); }
  });
  router.get("/profile", async (_req, res) => {
    try {
      const { token, user } = res.locals.account as { token: string; user: Principal };
      const record = await service.read(token, user.id);
      res.json({ record });
    } catch { res.status(503).json({ error: "Could not load your cloud profile." }); }
  });
  router.post("/profile", async (req, res) => {
    const parsed = ProfileCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Profile or preferences are invalid." }); return; }
    try {
      const record = await service.create(res.locals.account.token, parsed.data);
      if (!record) { res.status(409).json({ error: "A cloud profile already exists. Reload it; no data was overwritten." }); return; }
      res.status(201).json({ record });
    } catch { res.status(503).json({ error: "Could not create your cloud profile. Local data was preserved." }); }
  });
  router.put("/profile", async (req, res) => {
    const parsed = ProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Profile, preferences or version are invalid." }); return; }
    try {
      const { token, user } = res.locals.account as { token: string; user: Principal };
      const { expectedVersion, ...value } = parsed.data;
      const record = await service.update(token, user.id, expectedVersion, value);
      if (!record) { res.status(409).json({ error: "Your profile changed on another device. Reload before saving." }); return; }
      res.json({ record });
    } catch { res.status(503).json({ error: "Could not save your cloud profile." }); }
  });
  router.delete("/profile", async (_req, res) => {
    try {
      const { token, user } = res.locals.account;
      await service.removeProfile(token, user.id);
      res.status(204).end();
    } catch { res.status(503).json({ error: "Could not delete your cloud profile." }); }
  });
  router.delete("/account", async (req, res) => {
    const { user } = res.locals.account as { user: Principal };
    if (req.body?.confirmation !== "DELETE") { res.status(400).json({ error: "Explicit DELETE confirmation is required." }); return; }
    const signedIn = Date.parse(user.lastSignInAt ?? "");
    if (!Number.isFinite(signedIn) || Date.now() - signedIn > 15 * 60_000 || signedIn > Date.now() + 60_000) {
      res.status(403).json({ error: "Sign out and sign in again before deleting your account." }); return;
    }
    try {
      await service.deleteAccount(user.id);
      res.status(204).end();
    } catch { res.status(503).json({ error: "Account deletion failed. Your account has not been confirmed deleted." }); }
  });
  return router;
}
