/* eslint-disable import/prefer-default-export */
import fs from 'fs';
import path from 'path';

import Errors from './Errors';

export function getType(any) {
  const string = Object.prototype.toString.call(any).split(' ')[1];
  return string.substr(0, string.length - 1);
}

export function isArray(any) {
  if (Array.isArray) {
    return Array.isArray(any);
  }
  return Object.prototype.toString.call(any) === '[object Array]';
}

export function isBuffer(any) {
  return Buffer.isBuffer(any);
}

export function isExists(any) {
  return any !== undefined && any !== null;
}

export function isObject(any) {
  return Object.prototype.toString.call(any) === '[object Object]';
}

export function isString(any) {
  return typeof any === 'string';
}

export function isUrl(string) {
  return isString(string) && isExists(string.match(/(http|https):\/\//i));
}

export function containString(string, array) {
  const lString = string.toLowerCase();
  return isExists(array.map(item => item.toLowerCase()).find(item => item === lString));
}

export function mergeObjects(obj1, obj2) {
  return [obj1, obj2].reduce((merged, obj) => {
    Object.keys(obj).forEach((key) => {
      if (isObject(merged[key]) && isExists(obj[key])) {
        merged[key] = mergeObjects(merged[key], obj[key]);
      } else {
        merged[key] = obj[key];
      }
    });
    return merged;
  }, {});
}

export function validateOptions(options, defaultValues, types) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(options)) {
    if (!isExists(Object.getOwnPropertyDescriptor(defaultValues, key))) {
      return Errors.INVALID_OPTIONS;
    }
    if (isString(types[key])) {
      // eslint-disable-next-line valid-typeof
      if (!isExists(types[key].split('|').find(type => type === getType(options[key])))) {
        return Errors.INVALID_OPTION_VALUE;
      }
    } else {
      return validateOptions(options[key], defaultValues[key], types[key]);
    }
  }
  return undefined;
}

const tildeError = '\'~/\' was recognized as a directory name. '
  + 'If you want the correct behavior, should use \'process.env.HOME\'.';

export function createDirectory(target) {
  const components = target.split(path.sep);
  let current = '';
  if (target.startsWith(path.sep)) {
    current = path.sep;
  }
  if (target.startsWith('~')) {
    // eslint-disable-next-line no-console
    console.error(tildeError);
  }
  for (let idx = 0; idx < components.length; idx += 1) {
    current = path.join(current, components[idx]);
    if (!fs.existsSync(current)) {
      fs.mkdirSync(current);
    }
  }
}

export function removeDirectory(target) {
  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    if (target.startsWith('~')) {
      // eslint-disable-next-line no-console
      console.error(tildeError);
    }
    fs.readdirSync(target).forEach((subpath) => {
      const current = path.join(target, subpath);
      if (fs.lstatSync(current).isDirectory()) {
        removeDirectory(current);
      } else {
        fs.unlinkSync(current);
      }
    });
    fs.rmdirSync(target);
  }
}

export function removeLastPathComponent(target) {
  const components = target.split(path.sep);
  components.pop();
  if (target.startsWith(path.sep)) {
    return `${path.sep}${components.join(path.sep)}`;
  }
  return components.join(path.sep);
}

export function safePathJoin(...components) {
  if (components.findIndex(component => !isString(component)) >= 0) {
    return '';
  }
  return path.join(...components);
}

export function getPathes(target) {
  return fs.readdirSync(target).reduce((subpathes, subpath) => {
    const fullPath = path.join(target, subpath);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    return subpathes.concat(isDirectory ? getPathes(fullPath) : [fullPath]);
  }, []);
}
