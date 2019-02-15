import fs from 'fs-extra';
import path from 'path';

import { removeAllCacheFiles, readCacheFile, writeCacheFile } from './cacheFile';
import createCryptoStream from './createCryptoStream';
import createRangeStream from './createRangeStream';
import CryptoProvider from './CryptoProvider';
import { getPathes, safePath } from './pathUtil';
import { isExists } from './typecheck';
import openZip from './zipUtil';

function create(source, entries) {
  return {
    first: entries[0],
    length: entries.length,
    source,
    find: entryPath => entries.find(entry => entryPath === entry.entryPath),
    forEach: callback => entries.forEach(callback),
    map: callback => entries.map(callback),
    sort: callback => entries.sort(callback),
  };
}

function fromZip(zip) {
  return create(zip, Object.values(zip.files).reduce((entries, entry) => {
    return entries.concat([{
      entryPath: entry.path,
      getFile: options => zip.getFile(entry, options),
      size: entry.uncompressedSize,
      method: entry.compressionMethod,
      extraFieldLength: entry.extraFieldLength,
    }]);
  }, []));
}

function fromDirectory(dir, cryptoProvider) {
  let paths = (() => {
    /* istanbul ignore next */
    try { return JSON.parse(readCacheFile(dir) || '[]'); } catch (e) { return []; }
  })();
  if (paths.length === 0) {
    paths = getPathes(dir);
    writeCacheFile(dir, JSON.stringify(paths), true);
  }
  return create(dir, paths.reduce((entries, fullPath) => {
    const subPathOffset = path.normalize(dir).length + path.sep.length;
    const size = (() => {
      /* istanbul ignore next */
      try { return fs.lstatSync(fullPath).size; } catch (e) { return 0; }
    })();
    return entries.concat([{
      entryPath: safePath(fullPath).substring(subPathOffset),
      getFile: async (options = {}) => {
        const { encoding, end } = options;
        let file = await new Promise((resolve, reject) => {
          const stream = fs.createReadStream(fullPath, { encoding: 'binary' });
          let data = Buffer.from([]);
          stream
            .pipe(createRangeStream(0, end))
            .pipe(createCryptoStream(fullPath, size, cryptoProvider, CryptoProvider.Purpose.READ_IN_DIR))
            .on('data', (chunk) => { data = Buffer.concat([data, chunk]); })
            .on('error', e => reject(e))
            .on('end', () => resolve(data));
        });
        if (isExists(encoding)) {
          file = file.toString(encoding);
        }
        return file;
      },
      size,
    }]);
  }, []));
}

export default async function readEntries(input, cryptoProvider, logger) {
  if (fs.lstatSync(input).isFile()) { // TODO: When input is Buffer.
    /* istanbul ignore if */
    if (isExists(cryptoProvider)) {
      /* istanbul ignore next */
      input = cryptoProvider.run(fs.readFileSync(input), input, CryptoProvider.Purpose.READ_IN_DIR);
    }
    const zip = await openZip(input, cryptoProvider, logger);
    return fromZip(zip);
  }
  return fromDirectory(input, cryptoProvider);
}
