export const isArray = Array.isArray;

export namespace Utils {
    export interface Object {
        [key: string]: any;
    }
}

export const each = function <T extends Utils.Object>(obj: T, fn: Function): T {
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

export const some = function <T extends Utils.Object>(obj: T, fn: Function): boolean {
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

export const extend = (...args: any[]): Object => {
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


/**
 * Throw an error with possiable line number and source file.
 * @param message Error message
 * @param line Line number in template.
 * @param file Template file the error occured in.
 * @throws No seriously, the point is to throw an error.
 */
export const throwError = function (message: string, line?: string | number, file?: string): Error {
    if (line) {
        message += ' on line ' + line;
    }

    if (file) {
        message += ' in file ' + file;
    }

    throw new Error(message + '.');
}