// Keep aligned with the mobile CONSENT_VERSION and OpenAPI enum.
export const SUPPORTED_NATAL_CONSENT_VERSION = "2026-11-04-v3";

export type NatalConsentErrorCode = "CONSENT_REQUIRED" | "CONSENT_INVALID";

type NatalConsentResult =
  | { accepted: true }
  | { accepted: false; code: NatalConsentErrorCode; error: string };

/**
 * The API requires an explicit client declaration. Because this API is public,
 * this is not proof that a person actually saw or accepted the notice.
 */
export function validateNatalChartConsent(value: unknown): NatalConsentResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      accepted: false,
      code: "CONSENT_REQUIRED",
      error: "Your permission comes first.",
    };
  }

  const body = value as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(body, "consentAccepted")) {
    return {
      accepted: false,
      code: "CONSENT_REQUIRED",
      error: "Your permission comes first.",
    };
  }

  if (body.consentAccepted !== true || body.consentVersion !== SUPPORTED_NATAL_CONSENT_VERSION) {
    return {
      accepted: false,
      code: "CONSENT_INVALID",
      error: "Your saved permission is not current. Please review it before calculating.",
    };
  }

  return { accepted: true };
}
