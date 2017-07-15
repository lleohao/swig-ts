const isArray = Array.isArray;


export interface Object {
    [key: string]: any;
}

const strip = function (input: string): string {
    return input.replace(/^\s+|\s+$/g, '');
}

const startWith = function (input: string, prefix: string): boolean {
    return input.indexOf(prefix) === 0;
}

/**
 * Test if a string ends with a given suffix.
 * @param  {string} str    String to test against.
 * @param  {string} suffix Suffix to check for.
 * @return {boolean}
 */
const endsWith = function (str: string, suffix: string) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};


const each = function <T extends Object>(obj: T, fn: Function): T {
    let i, l;

    if (isArray(obj)) {
        i = 0;
        l = obj.length;
        for (i; i < l; i += 1) {
            if (fn(obj[i], i, obj) === false) {
                break;
            }
        }
    } else {
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (fn(obj[i], i, obj) === false) {
                    break;
                }
            }
        }
    }

    return obj;
}

const some = function <T extends Object>(obj: T, fn: Function): boolean {
    let i = 0,
        result,
        l;

    if (isArray(obj)) {
        l = obj.lengthl
        for (i; i < l; i += 1) {
            result = fn(obj[i], i, obj);
            if (result) {
                break;
            }
        }
    } else {
        each(obj, function (value: any, index: number) {
            result = fn(value, index, obj);
            return !(result);
        })
    }

    return !!result;
}

const map = function <T extends Object>(obj: T, fn: Function): Object {
    let result: Object = {};

    if (isArray(obj)) {
        for (let i = 0, l = obj.length; i < l; i += 1) {
            result[i] = fn(obj[i], i, obj);
        }
    } else {
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                result[i] = fn(obj[i], i);
            }
        }
    }

    return result;
}

const extend = (...args: any[]): Object => {
    let target = args[0];
    let objs = (args.length > 1) ? Array.prototype.slice.call(args, 1) : [];

    for (let i = 0; i < objs.length; i++) {
        let obj = objs[i] || {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                (target as any)[key] = obj[key];
            }
        }
    }

    return target;
}

const keys = function (obj: any) {
    if (!obj) {
        return [];
    }

    if (Object.keys) {
        return Object.keys(obj);
    }

    return map(obj, function (v: any, k: any) {
        return k;
    })
}


/**
 * Throw an error with possiable line number and source file.
 * @param message Error message
 * @param line Line number in template.
 * @param file Template file the error occured in.
 * @throws No seriously, the point is to throw an error.
 */
const throwError = function (message: string, line?: string | number, file?: string): Error {
    if (line) {
        message += ' on line ' + line;
    }

    if (file) {
        message += ' in file ' + file;
    }

    throw new Error(message + '.');
}


export default {
    isArray: isArray,
    each: each,
    some: some,
    map: map,
    keys: keys,
    extend: extend,
    strip: strip,
    startWith: startWith,
    endsWith: endsWith,
    throwError: throwError
}