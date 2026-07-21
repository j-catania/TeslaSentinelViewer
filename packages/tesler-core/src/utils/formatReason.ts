/**
 * Turns a raw Tesla `event.json` reason code (e.g. "sentry_aware_object_detection")
 * into a short, human-readable label (e.g. "Object Detection").
 */
export const formatReason = (reason: string): string =>
    reason
        .replace(/^sentry_aware_/i, '')
        .replace(/^user_interaction_/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .slice(0, 22);
