import utils from './utils';
import dateFormatter from './dateformat';

/**
 * Filters are simply function that perform transformations on their first input argument.
 * Filter are run at render time, so they may not directly modify the compiled template structure in any way.
 * All of Swig's built-in filters are written in this same way. For more example, reference the 'filters.js' file in Swig's source.
 * 
 * To disabled auto-escaping on a custom filter, simply add a property to the filter method `safe = true;` and the output from this will not be escaped, no metter what the global settings are for Swig.
 *
 *  @typedef {function} Filter
 *
 * @example
 * // This filter will return 'bazbop' if the idx on the input is not 'foobar'
 * swig.setFilter('foobar', function (input, idx) {
 *   return input[idx] === 'foobar' ? input[idx] : 'bazbop';
 * });
 * // myvar = ['foo', 'bar', 'baz', 'bop'];
 * // => {{ myvar|foobar(3) }}
 * // Since myvar[3] !== 'foobar', we render:
 * // => bazbop
 *
 * @example
 * // This filter will disable auto-escaping on its output:
 * function bazbop (input) { return input; }
 * bazbop.safe = true;
 * swig.setFilter('bazbop', bazbop);
 * // => {{ "<p>"|bazbop }}
 * // => <p>
 *
 * @param {*} input Input argument, automatically sent from Swig's built-in parser.
 * @param {...*} [args] All other arguments are defined by the Filter author.
 * @return {*}
 */

export interface Filter extends Function {
    (input: any, ...arg): any;
    safe?: boolean;
}

export interface Filters {
    [key: string]: Filter;
}

/**
 * Helper method to recursively run a filter across an object/array and apply it to all fo the object/array's values.
 * @param input 
 * @private
 */
const iterateFilter = function (input: any) {
    let out: Object = {};
    let self = this;

    if (utils.isArray(input)) {
        return utils.map(input, function (value: any) {
            return self.apply(null, arguments);
        })
    };

    if (typeof input === 'object') {
        utils.each(input, function (value: any, key: string) {
            out[key] = self.apply(null, arguments);
        });
        return out;
    }

    return;
}

/**
 * Backslash-escape characters that need to be escaped.
 *
 * @example
 * {{ "\"quoted string\""|addslashes }}
 * // => \"quoted string\"
 *
 * @param  {*}  input
 * @return {*}        Backslash-escaped string.
 */
const addslashes = function (input: any) {
    let out = iterateFilter.apply(addslashes, arguments);
    if (out !== undefined) {
        return out;
    }

    return input.replace(/\\/g, '\\\\').replace(/\'/g, "\\'").replace(/\"/g, '\\"');
}

/**
 * Upper-case the first letter of the input and lower-case the rest;
 * 
 * @example
 * {{ "i like Burritos"|capitalize}}
 * // => I like burritos
 * @param input If given an array or object, each string member will be run through the filter individually.
 * @return Returns the same type as the input.
 */
const capitalize = function (input: any) {
    let out = iterateFilter.apply(capitalize, arguments);
    if (out !== undefined) {
        return out;
    }

    return input.toString().charAt(0).toUpperCase() + input.toString().substr(1).toLowerCase();
}

const date = function (input: string | Date, format: string, offset: number, abbr: string) {
    let l = format.length,
        date = new dateFormatter.DateZ(input),
        cur,
        i = 0,
        out = '';

    if (offset) {
        date.setTimezoneOffset(offset);
    }

    for (i; i < l; i += 1) {
        cur = format.charAt(i);
        if (cur === '\\') {
            i += 1;
            out += (i < l) ? format.charAt(i) : cur;
        } else if (dateFormatter.hasOwnProperty(cur)) {
            out += dateFormatter[cur](date, offset, abbr);
        } else {
            out += cur;
        }
    }

    return out;
}

const _default = function (input: any, def: any) {
    return (typeof input !== 'undefined' && (input || typeof input === 'number')) ? input : def;
}

const escape = function (input: any, type: string) {
    let out = iterateFilter.apply(escape, arguments),
        inp = input,
        i = 0,
        code;

    if (out !== undefined) {
        return out;
    }

    if (typeof input !== 'string') {
        return input;
    }

    out = '';

    switch (type) {
        case 'js':
            inp = inp.replace(/\\/, '\\u005c');
            for (i; i < inp.length; i += 1) {
                code = inp.charCodeAt(i);
                if (code < 32) {
                    code = code.toString(16).toUpperCase();
                    code = (code.length < 2) ? '0' + code : code;
                    out += '\\u00' + code;
                } else {
                    out += inp[i];
                }
            }
            return out.replace(/&/g, '\\u0026')
                .replace(/</g, '\\u003C')
                .replace(/>/g, '\\u003E')
                .replace(/\'/g, '\\u0027')
                .replace(/"/g, '\\u0022')
                .replace(/\=/g, '\\u003D')
                .replace(/-/g, '\\u002D')
                .replace(/;/g, '\\u003B');

        default:
            return inp.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
    }
}
const e = escape;

const first = function (input: any) {
    if (typeof input === 'object' && !utils.isArray(input)) {
        let keys = utils.keys(input);
        return input[keys[0]];
    }

    if (typeof input === 'string') {
        return input.substr(0, 1);
    }

    return input[0];
}

const safe = function (input: any) {
    return input;
}

const url_encode = function (input: any) {
    let out = iterateFilter.apply(url_encode, arguments);

    if (out !== undefined) {
        return out;
    }

    return decodeURIComponent(input);
}

const url_decode = function (input: any) {
    let out = iterateFilter.apply(url_decode, arguments);
    if (out !== undefined) {
        return out;
    }

    return encodeURIComponent(input);
}

export default {
    addslashes: addslashes,
    capitalize: capitalize,
    date: date,
    "default": _default,
    e: escape,
    escape: escape,
    first: first,
    safe: safe,
    url_encode: url_encode,
    url_decode: url_decode
}