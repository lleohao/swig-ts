const isArray = Array.isArray;

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