/**
 * @async
 * @param  {string} input
 * @param  {CryptoProvider} cryptoProvider
 * @param  {import('./Logger').default} logger
 */
export default function readEntries(input: string, cryptoProvider: CryptoProvider, logger: import('./Logger').default): Promise<FileEntryObject<import("./zipUtil").ZipFileInformation, import("adm-zip").IZipEntry & EntryBasicInformation & ZipfileEntryInformation> | FileEntryObject<string, EntryBasicInformation>>;
export type ReadStreamOption = {
    highWaterMark: number;
};
export type FileEntryObject<T, S> = {
    first: S;
    length: number;
    source: T;
    get: (idx: number) => S;
    find: (entryPath: string, strict: boolean) => S;
    forEach: (callback: (value: S, index: number, array: S[]) => void) => void;
    map: (callback: (value: S, index: number, array: S[]) => any) => void;
    sort: (callback: (a: S, b: S) => number) => void;
};
export type EntryBasicInformation = {
    entryPath: string;
    size: number;
    getFile: (options: {
        endocing: string;
        end: number;
    }) => (Promise<Buffer> | Buffer);
};
export type ZipfileEntryInformation = {
    method: string;
    extraFieldLength: number;
};
export type IZipEntryPlus = import("adm-zip").IZipEntry & EntryBasicInformation & ZipfileEntryInformation;
import CryptoProvider from "./CryptoProvider";
