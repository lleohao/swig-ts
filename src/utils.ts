const isArray = Array.isArray;
const extend = Object.assign;
const keys = Object.keys;

const each = function <T, U extends object>(obj: T[] | U, fn: (v: T | any, i?: number | string, o?: T[] | U) => void, context?): T[] | U {
    if (isArray(obj)) {
        obj.forEach(fn, context);
    } else {
        for (const i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (context) {
                    fn.call(context, obj[i], i, obj)
                } else {
                    fn(obj[i], i, obj);
                }
            }
        }
    }

    return obj;
};

const map = function <T, U>(obj: T[], fn: (v: T, i?: number, o?: T[]) => U, context?): U[] {
    return obj.map(fn, context);
};


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
    ;
}


export default {
    isArray,
    each,
    map,
    keys,
    extend,
    throwError
}