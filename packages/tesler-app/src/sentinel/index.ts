// Android-only TeslaCam USB drive access via Expo's Storage Access Framework (SAF) wrapper.
// Mirrors the `window.sentinel` API shape used by tesler-desktop's preload
// (see packages/tesler-desktop/electron/preload/index.ts), adapted to SAF's opaque
// `content://` document URIs. See docs/USB_FILE_ACCESS.md for background/rollout plan.
// NOTE: expo-file-system's default entrypoint was rewritten around File/Directory classes
// in SDK 52+ and no longer exposes StorageAccessFramework — it lives under the `/legacy` subpath.
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Event, TeslaEventJSON, Videos } from 'tesler-core';

const TREE_URI_KEY = 'tesler:treeUri';

export type ClipType = 'SentryClips' | 'SavedClips';

/** Thrown when a persisted SAF permission is no longer valid (revoked by the user or the OS). */
export class PermissionRevokedError extends Error {
    constructor() {
        super('TeslaCam folder access was revoked. Please select the folder again.');
        this.name = 'PermissionRevokedError';
    }
}

/** SAF child URIs encode the file/folder name as their last (URL-encoded) path segment. */
function getName(uri: string): string {
    try {
        const decoded = decodeURIComponent(uri);
        return decoded.substring(decoded.lastIndexOf('/') + 1);
    } catch {
        return uri;
    }
}

/** SAF has no path-concatenation API — finding a child by name means listing the parent. */
async function findChild(dirUri: string, name: string): Promise<string | undefined> {
    const children = await FileSystem.StorageAccessFramework.readDirectoryAsync(dirUri);
    return children.find((uri) => getName(uri) === name);
}

/** Prompts the user to pick the TeslaCam folder (or drive root) and persists the granted permission. */
export async function pickTeslaCamFolder(): Promise<string | null> {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return null;
    await AsyncStorage.setItem(TREE_URI_KEY, permissions.directoryUri);
    return permissions.directoryUri;
}

/** Reads back the previously persisted TeslaCam folder URI, if any, so the user isn't re-prompted every launch. */
export function getPersistedTreeUri(): Promise<string | null> {
    return AsyncStorage.getItem(TREE_URI_KEY);
}

export async function clearPersistedTreeUri(): Promise<void> {
    await AsyncStorage.removeItem(TREE_URI_KEY);
}

/** Lists clip folder URIs under `<treeUri>/<clipType>`. Throws PermissionRevokedError if access was lost. */
export async function listClips(treeUri: string, clipType: ClipType): Promise<string[]> {
    let clipTypeUri: string | undefined;
    try {
        clipTypeUri = await findChild(treeUri, clipType);
    } catch {
        await clearPersistedTreeUri();
        throw new PermissionRevokedError();
    }
    if (!clipTypeUri) return [];
    return FileSystem.StorageAccessFramework.readDirectoryAsync(clipTypeUri);
}

/** Reads and parses `event.json` inside a clip folder. */
export async function readEvent(clipUri: string): Promise<Event> {
    const eventUri = await findChild(clipUri, 'event.json');
    if (!eventUri) throw new Error(`event.json not found in ${clipUri}`);
    const raw = await FileSystem.readAsStringAsync(eventUri, { encoding: FileSystem.EncodingType.UTF8 });
    const parsed = JSON.parse(raw) as TeslaEventJSON;
    return { ...parsed, timestamp: new Date(parsed.timestamp), root: clipUri };
}

/** Reads `thumb.png` inside a clip folder as base64, if present. */
export async function readThumbBase64(clipUri: string): Promise<string | undefined> {
    const thumbUri = await findChild(clipUri, 'thumb.png');
    if (!thumbUri) return undefined;
    return FileSystem.readAsStringAsync(thumbUri, { encoding: FileSystem.EncodingType.Base64 });
}

/** Groups a clip folder's `.mp4` children by camera, mirroring tesler-desktop's Viewers.tsx grouping. */
export async function listVideos(clipUri: string): Promise<Videos> {
    const children = await FileSystem.StorageAccessFramework.readDirectoryAsync(clipUri);
    const named = children
        .map((uri) => ({ uri, name: getName(uri) }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return {
        backs: named.filter(({ name }) => name.endsWith('-back.mp4')).map(({ uri }) => uri),
        rights: named.filter(({ name }) => name.endsWith('-right_repeater.mp4')).map(({ uri }) => uri),
        lefts: named.filter(({ name }) => name.endsWith('-left_repeater.mp4')).map(({ uri }) => uri),
        fronts: named.filter(({ name }) => name.endsWith('-front.mp4')).map(({ uri }) => uri),
    };
}

/** Deletes an entire clip folder. */
export async function deleteClip(clipUri: string): Promise<void> {
    await FileSystem.StorageAccessFramework.deleteAsync(clipUri);
}
