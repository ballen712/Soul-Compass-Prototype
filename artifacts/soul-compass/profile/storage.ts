import type { UserProfile } from './profile';
import type { NatalChartResponse } from '@workspace/api-client-react';
import { CalculateNatalChartResponse } from '@workspace/api-zod';
import {
  BirthTimeSchema, CONSENT_VERSION, DateSchema, DraftSchema, LEGACY_KEY, LOCAL_KEY,
  LocalRecordSchema, LocationSchema, PreferencesSchema, ProfileSchema, emptyRecord, dailyPreferences, localDayKey,
  type LocalPreferences, type LocalRecord,
} from './local';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
type Snapshot = { record: LocalRecord; loaded: boolean; error: string | null };
export type CachedNatalChart = {
  profileKey: string;
  data: NatalChartResponse;
  disambiguation: 'earlier' | 'later' | null;
};
const NATAL_CHART_CACHE_KEY = 'soul-compass.natal-chart-cache.v1';

/** One serialized writer. Legacy records are never deleted or overwritten. */
export class LocalProfileStore {
  private snapshot: Snapshot = { record: emptyRecord(), loaded: false, error: null };
  private listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private loading: Promise<void> | null = null;
  private consentRevision = 0;
  private denyRequests = false;
  private clearingData = false;
  private controllers = new Set<AbortController>();
  constructor(private storage: StorageAdapter) {}
  getSnapshot = () => this.snapshot;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private publish(next: Snapshot) {
    this.snapshot = next;
    this.listeners.forEach(fn => fn());
  }
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn);
    this.queue = next.catch(() => {});
    return next;
  }
  private stopRequests() {
    this.controllers.forEach(controller => controller.abort());
    this.controllers.clear();
  }
  load = (): Promise<void> => {
    if (this.loading) return this.loading;
    const operation = this.enqueue(async () => {
      try {
        const current = await this.storage.getItem(LOCAL_KEY);
        let record = emptyRecord();
        if (current !== null) {
          record = LocalRecordSchema.parse(JSON.parse(current));
        } else {
          const legacy = await this.storage.getItem(LEGACY_KEY);
          if (legacy !== null) {
            const value: unknown = JSON.parse(legacy);
            const parsed = ProfileSchema.safeParse(value);
            if (parsed.success) record.profile = parsed.data;
            else {
              if (!value || typeof value !== 'object') throw new Error('Invalid legacy data');
              const old = value as Record<string, unknown>;
              // This is the recognized older residence-only format, not a corrupt modern profile.
              if (!('homeLocation' in old) || 'birthPlace' in old) throw new Error('Invalid legacy profile');
              const draft = DraftSchema.parse({
                ...(old.birthDate !== undefined ? { birthDate: DateSchema.parse(old.birthDate) } : {}),
                ...(old.birthTime !== undefined ? { birthTime: BirthTimeSchema.parse(old.birthTime) } : {}),
                currentResidence: old.homeLocation === null ? null : LocationSchema.parse(old.homeLocation),
              });
              record.onboardingDraft = draft;
            }
            await this.storage.setItem(LOCAL_KEY, JSON.stringify(record));
          }
        }
        // An older consent explanation never authorizes the current policy.
        record.preferences = dailyPreferences(record.preferences);
        if (record.privacy.consentVersion !== CONSENT_VERSION) record.privacy.astrologyApiConsent = false;
        this.denyRequests = !record.privacy.astrologyApiConsent;
        this.publish({ record, loaded: true, error: null });
      } catch {
        this.denyRequests = true;
        this.stopRequests();
        this.publish({ ...this.snapshot, loaded: true, error: 'Could not read or migrate local data. Your original data is preserved. Retry without clearing storage.' });
      }
    });
    this.loading = operation.finally(() => { this.loading = null; });
    return this.loading;
  };
  private update(change: (record: LocalRecord) => LocalRecord): Promise<void> {
    return this.enqueue(async () => {
      if (this.clearingData) throw new Error('Local data is being deleted. Please wait and try again.');
      if (!this.snapshot.loaded || this.snapshot.error) throw new Error('Reload local data before saving.');
      try {
        const next = LocalRecordSchema.parse(change({
          ...this.snapshot.record,
          preferences: dailyPreferences(this.snapshot.record.preferences),
        }));
        next.preferences = dailyPreferences(next.preferences);
        await this.storage.setItem(LOCAL_KEY, JSON.stringify(next));
        next.preferences = dailyPreferences(next.preferences);
        // A concurrent revocation takes effect before any queued disk write completes.
        if (this.denyRequests) next.privacy = this.snapshot.record.privacy;
        this.publish({ record: next, loaded: true, error: null });
      } catch {
        throw new Error('Could not save local data. Your previous saved data is preserved. Please retry.');
      }
    });
  }
  // Expiration is a derived local state: no network or disk write is needed
  // to stop using yesterday's mood, even when device storage is unavailable.
  refreshDailyPreferences = () => {
    if (!this.snapshot.loaded || this.snapshot.error) return;
    const preferences = dailyPreferences(this.snapshot.record.preferences);
    if (preferences === this.snapshot.record.preferences) return;
    this.publish({ ...this.snapshot, record: { ...this.snapshot.record, preferences } });
  };
  saveProfile = (profile: UserProfile, natalConsent?: boolean) => {
    if (natalConsent === undefined) {
      return this.update(record => ({
        ...record, profile: ProfileSchema.parse(profile), onboardingDraft: null,
      }));
    }

    // Save the profile and its first-run chart permission as one local update.
    // Requests remain blocked until the permission and profile are both durable.
    const revision = ++this.consentRevision;
    this.denyRequests = true;
    this.stopRequests();
    const timestamp = natalConsent ? new Date().toISOString() : null;
    return this.enqueue(async () => {
      if (this.clearingData) throw new Error('Local data is being deleted. Please wait and try again.');
      if (!this.snapshot.loaded || this.snapshot.error) throw new Error('Reload local data before saving.');
      const next = LocalRecordSchema.parse({
        ...this.snapshot.record,
        profile: ProfileSchema.parse(profile),
        onboardingDraft: null,
        privacy: {
          astrologyApiConsent: natalConsent,
          consentTimestamp: timestamp,
          consentVersion: natalConsent ? CONSENT_VERSION : null,
          revokedAt: null,
        },
      });
      try {
        await this.storage.setItem(LOCAL_KEY, JSON.stringify(next));
      } catch {
        throw new Error('Could not save local data. Your previous saved data is preserved. Please retry.');
      }
      if (revision !== this.consentRevision) return;
      this.denyRequests = !natalConsent;
      this.publish({ record: next, loaded: true, error: null });
    });
  };
  loadNatalChartCache = async (profileKey: string): Promise<CachedNatalChart | null> => {
    if (this.clearingData) return null;
    const revision = this.consentRevision;
    const raw = await this.storage.getItem(NATAL_CHART_CACHE_KEY);
    if (raw === null || this.clearingData || revision !== this.consentRevision) return null;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error('The saved Natal Chart could not be read. Retry the calculation to replace it.');
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('The saved Natal Chart is invalid. Retry the calculation to replace it.');
    }
    const entry = value as Record<string, unknown>;
    if (entry.profileKey !== profileKey) return null;
    if (entry.disambiguation !== null && entry.disambiguation !== 'earlier' && entry.disambiguation !== 'later') {
      throw new Error('The saved Natal Chart is invalid. Retry the calculation to replace it.');
    }
    const parsed = CalculateNatalChartResponse.safeParse(entry.data);
    if (!parsed.success) {
      throw new Error('The saved Natal Chart is invalid. Retry the calculation to replace it.');
    }
    return {
      profileKey,
      data: JSON.parse(JSON.stringify(parsed.data)) as NatalChartResponse,
      disambiguation: entry.disambiguation,
    };
  };
  saveNatalChartCache = async (
    profileKey: string,
    data: NatalChartResponse,
    disambiguation: 'earlier' | 'later' | null,
    expectedProfile: UserProfile,
  ): Promise<void> => {
    const parsed = CalculateNatalChartResponse.safeParse(data);
    if (!parsed.success) throw new Error('The chart response could not be validated for local storage.');
    if (this.clearingData || this.snapshot.record.profile !== expectedProfile) {
      throw new Error('The local profile changed before the chart could be saved.');
    }
    const revision = this.consentRevision;
    await this.enqueue(async () => {
      if (this.clearingData || revision !== this.consentRevision || this.snapshot.record.profile !== expectedProfile) {
        throw new Error('The local profile changed before the chart could be saved.');
      }
      await this.storage.setItem(NATAL_CHART_CACHE_KEY, JSON.stringify({
        profileKey, data: parsed.data, disambiguation,
      }));
    });
  };
  savePreferences = (preferences: LocalPreferences) => {
    // Apply only fields changed by this action, preserving queued collection edits.
    const baseline = this.snapshot.record.preferences;
    const different = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
    const languageChanged = different(baseline.language, preferences.language);
    const appearanceChanged = different(baseline.appearance, preferences.appearance);
    const collectionChanged = different(baseline.crystalCollection, preferences.crystalCollection);
    const hiddenChanged = different(baseline.crystalPreferences.hiddenCrystals, preferences.crystalPreferences.hiddenCrystals);
    const feelingChanged = different(baseline.crystalPreferences.feeling, preferences.crystalPreferences.feeling);
    const selectedDay = localDayKey();
    return this.update(record => ({
      ...record, preferences: PreferencesSchema.parse({
        language: languageChanged ? preferences.language : record.preferences.language,
        appearance: appearanceChanged ? preferences.appearance : record.preferences.appearance,
        crystalCollection: collectionChanged ? preferences.crystalCollection : record.preferences.crystalCollection,
        crystalPreferences: {
          intentions: [],
          hiddenCrystals: hiddenChanged ? preferences.crystalPreferences.hiddenCrystals : record.preferences.crystalPreferences.hiddenCrystals,
          feeling: feelingChanged ? preferences.crystalPreferences.feeling : record.preferences.crystalPreferences.feeling,
          feelingDate: feelingChanged
            ? preferences.crystalPreferences.feeling ? selectedDay : null
            : record.preferences.crystalPreferences.feelingDate,
        },
      }),
    }));
  };
  toggleCrystal = (id: string) => this.update(record => ({
    ...record, preferences: PreferencesSchema.parse({
      ...record.preferences,
      crystalCollection: record.preferences.crystalCollection.includes(id)
        ? record.preferences.crystalCollection.filter(value => value !== id)
        : [...record.preferences.crystalCollection, id],
    }),
  }));
  setConsent = (allowed: boolean): Promise<void> => {
    if (this.clearingData) return Promise.reject(new Error('Local data is being deleted. Please wait and try again.'));
    const revision = ++this.consentRevision;
    const now = new Date().toISOString();
    if (!allowed) {
      this.denyRequests = true;
      this.stopRequests();
      this.publish({ ...this.snapshot, record: {
        ...this.snapshot.record,
        privacy: { ...this.snapshot.record.privacy, astrologyApiConsent: false, revokedAt: now },
      } });
    }
    return this.enqueue(async () => {
      if (!this.snapshot.loaded || this.snapshot.error) throw new Error('Reload local data before changing permission.');
      if (allowed && revision !== this.consentRevision) return;
      const privacy = allowed
        ? { astrologyApiConsent: true, consentTimestamp: now, consentVersion: CONSENT_VERSION, revokedAt: null }
        : { ...this.snapshot.record.privacy, astrologyApiConsent: false, revokedAt: now };
      const record = LocalRecordSchema.parse({ ...this.snapshot.record, privacy });
      try {
        await this.storage.setItem(LOCAL_KEY, JSON.stringify(record));
      } catch {
        throw new Error(allowed
          ? 'Permission was not saved. No birth details will be sent. Please retry.'
          : 'Blocked for this session, but revocation could not be saved. Please retry before closing the app.');
      }
      if (revision !== this.consentRevision) return;
      this.denyRequests = !allowed;
      this.publish({ record, loaded: true, error: null });
    });
  };
  clearLocalData = (): Promise<void> => {
    if (this.clearingData) return Promise.reject(new Error('Local data deletion is already in progress.'));
    if (!this.snapshot.loaded || this.snapshot.error) {
      return Promise.reject(new Error('Reload local data before deleting it.'));
    }

    this.clearingData = true;
    this.denyRequests = true;
    this.consentRevision += 1;
    this.stopRequests();
    const revokedAt = new Date().toISOString();
    const revokedRecord = LocalRecordSchema.parse({
      ...this.snapshot.record,
      privacy: { ...this.snapshot.record.privacy, astrologyApiConsent: false, revokedAt },
    });
    this.publish({ record: revokedRecord, loaded: true, error: null });

    return this.enqueue(async () => {
      try {
        // Persist the revocation first when possible, so a partial deletion
        // cannot leave a previously granted calculation permission active.
        try {
          await this.storage.setItem(LOCAL_KEY, JSON.stringify(revokedRecord));
        } catch {
          // Continue with removal. If removal also fails, the session remains
          // blocked and the UI asks the user to retry before closing the app.
        }
        await this.storage.removeItem(NATAL_CHART_CACHE_KEY);
        await this.storage.removeItem(LEGACY_KEY);
        await this.storage.removeItem(LOCAL_KEY);
        this.publish({ record: emptyRecord(), loaded: true, error: null });
      } catch {
        throw new Error('Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.');
      } finally {
        this.clearingData = false;
      }
    });
  };
  canCalculate = () => !this.denyRequests && this.snapshot.loaded && !this.snapshot.error
    && this.snapshot.record.privacy.astrologyApiConsent
    && this.snapshot.record.privacy.consentVersion === CONSENT_VERSION;
  /** Request-time permission check; no automatic retries or queued offline sends. */
  async withCalculationConsent<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (!this.canCalculate()) throw new Error('Permission is required before sending birth details.');
    const revision = this.consentRevision;
    const controller = new AbortController();
    let timedOut = false;
    let rejectAborted!: (error: Error) => void;
    const aborted = new Promise<never>((_, reject) => { rejectAborted = reject; });
    const onAbort = () => {
      const error = timedOut
        ? new Error('The chart request timed out. Check your connection and try again.')
        : new Error('Calculation permission changed. Please try again.');
      if (!timedOut) error.name = 'AbortError';
      rejectAborted(error);
    };
    controller.signal.addEventListener('abort', onAbort, { once: true });
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20_000);
    this.controllers.add(controller);
    try {
      const result = await Promise.race([request(controller.signal), aborted]);
      if (!this.canCalculate() || revision !== this.consentRevision || controller.signal.aborted) {
        throw new Error('Calculation permission changed. Please try again.');
      }
      return result;
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener('abort', onAbort);
      this.controllers.delete(controller);
    }
  }
  dispose = () => { this.stopRequests(); };
}
