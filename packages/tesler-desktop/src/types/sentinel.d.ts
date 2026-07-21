// Global type augmentation for the contextBridge API exposed by the preload.
// This eliminates the need for // @ts-ignore on every window.sentinel call.
interface Window {
    sentinel: {
        getFiles(path: string): Promise<string[]>;
        readStringFile(path: string): Promise<string>;
        readBufferFile(path: string): Promise<ArrayBuffer>;
        readB64File(path: string): Promise<string>;
        remove(path: string): Promise<void>;
    };
}
