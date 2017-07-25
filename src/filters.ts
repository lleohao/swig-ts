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
const addslashes = function (input: any): string {
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
const capitalize = function (input: any): string {
    let out = iterateFilter.apply(capitalize, arguments);
    if (out !== undefined) {
        return out;
    }

    return input.toString().charAt(0).toUpperCase() + input.toString().substr(1).toLowerCase();
}

/**
 * Format a date or Date-compatible string.
 * 
 * @example
 * // now = new Date();
 * {{ now|date('Y-m-d') }}
 * // => 2013-08-14
 * @example
 * // now = new Date();
 * {{ now|date('jS \o\f F') }}
 * // => 4th of July
 * 
 * @param   input     
 * @param   format      PHP-style date format compatible string. Escape characters with <code>\</code> for string literals.
 * @param   offset      Timezone offset from GMT in minutes.
 * @param   abbr        Timezone abbreviation. Used for output only.
 * @return  {string}    Formatted date string.
 */
const date = function (input: string | Date, format: string, offset: number, abbr: string): string {
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

/**
 * If the input is `undefined`, `null` or `false`, a default return value can be specified.
 * 
 * @example
 * {{ null_value|default('Tacos') }}
 * @example
 * {{ "Burritos"|default("Tacos") }}
 * // => Burritos
 * 
 * @param   input  
 * @param   def         Value to return if `input` is `undefined`, `null`, or `false`.
 * @return  {string}    `input` or `def` value.
 */
const _default = function (input: any, def: any): string {
    return (typeof input !== 'undefined' && (input || typeof input === 'number')) ? input : def;
}

/**
 * Force escape the output of the variable. Optionally use `e` as a shortcut filter name. This filter will be applied by default if autoescape is turned on.
 *
 * @example
 * {{ "<blah>"|escape }}
 * // => &lt;blah&gt;
 *
 * @example
 * {{ "<blah>"|e("js") }}
 * // => \u003Cblah\u003E
 *
 * @param  input
 * @param  [type='html']    If you pass the string js in as the type, output will be escaped so that it is safe for JavaScript execution.
 * @return {string}         Escaped string.
 */
const escape = function (input: any, type: string): string {
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

/**
 * Get the first item in an array or character in a string. All other objects will attempt to return the first value available.
 *
 * @example
 * // my_arr = ['a', 'b', 'c']
 * {{ my_arr|first }}
 * // => a
 *
 * @example
 * // my_val = 'Tacos'
 * {{ my_val|first }}
 * // T
 *
 * @param   input
 * @return  {string}    The first item of the array or first character of the string input.
 */
const first = function (input: any): string {
    if (typeof input === 'object' && !utils.isArray(input)) {
        let keys = utils.keys(input);
        return input[keys[0]];
    }

    if (typeof input === 'string') {
        return input.substr(0, 1);
    }

    return input[0];
}

/**
 * Group an array of objects by a common key. If an array is not provided, the input value will be returned untouched.
 *
 * @example
 * // people = [{ age: 23, name: 'Paul' }, { age: 26, name: 'Jane' }, { age: 23, name: 'Jim' }];
 * {% for agegroup in people|groupBy('age') %}
 *   <h2>{{ loop.key }}</h2>
 *   <ul>
 *     {% for person in agegroup %}
 *     <li>{{ person.name }}</li>
 *     {% endfor %}
 *   </ul>
 * {% endfor %}
 *
 * @param   input       Input object.
 * @param   key         Key to group by.
 * @return  {object}    Grouped arrays by given key.
 */
const groupBy = function (input: any, key: string): object {
    if (!utils.isArray(input)) {
        return;
    }

    const out = {};

    input.forEach((value) => {
        if (!value.hasOwnProperty(key)) {
            return;
        }
        let keyName = value[key],
            newValue = Object.assign({}, value);
        delete newValue[key];

        if (!out[keyName]) {
            out[keyName] = [];
        }

        out[keyName].push(newValue);
    });

    return out;
}

/**
 * Join the input with a string.
 *
 * @example
 * // my_array = ['foo', 'bar', 'baz']
 * {{ my_array|join(', ') }}
 * // => foo, bar, baz
 *
 * @example
 * // my_key_object = { a: 'foo', b: 'bar', c: 'baz' }
 * {{ my_key_object|join(' and ') }}
 * // => foo and bar and baz
 *
 * @param   input
 * @param   glue    String value to join items together.
 * @return  {string}
 */
const join = function (input: any, glue: string): string {
    if (utils.isArray(input)) {
        return input.join(glue);
    }

    if (typeof input === 'object') {
        const out = [];
        utils.each(input, (value) => {
            out.push(value);
        });
        return out.join(glue);
    }

    return input;
}

/**
 * Return a string representation of an JavaScript object.
 *
 * Backwards compatible with swig@0.x.x using `json_encode`.
 *
 * @example
 * // val = { a: 'b' }
 * {{ val|json }}
 * // => {"a":"b"}
 *
 * @example
 * // val = { a: 'b' }
 * {{ val|json(4) }}
 * // => {
 * //        "a": "b"
 * //    }
 *
 * @param   input
 * @param   [indent]    Number of spaces to indent for pretty-formatting.
 * @return              A valid JSON string.
 */
const json = function (input: any, indent: number): string {
    return JSON.stringify(input, null, indent || 0);
};

/**
 * Get the last item in an array or character in a string. All other objects will attempt to return the last value available.
 *
 * @example
 * // my_arr = ['a', 'b', 'c']
 * {{ my_arr|last }}
 * // => c
 *
 * @example
 * // my_val = 'Tacos'
 * {{ my_val|last }}
 * // s
 *
 * @param   input
 * @return  {any}   The last item of the array or last character of the string.input.
 */
const last = function (input: any) {
    if (typeof input === 'object' && !utils.isArray(input)) {
        let keys = utils.keys(input);
        return input[keys[keys.length - 1]];
    }

    if (typeof input === 'string') {
        return input.charAt(input.length - 1);
    }

    return input[input.length - 1];
};

/**
 * Get the number of items in an array, string, or object.
 *
 * @example
 * // my_arr = ['a', 'b', 'c']
 * {{ my_arr|length }}
 * // => 3
 *
 * @example
 * // my_str = 'Tacos'
 * {{ my_str|length }}
 * // => 5
 *
 * @example
 * // my_obj = {a: 5, b: 20}
 * {{ my_obj|length }}
 * // => 2
 *
 * @param  input
 * @return {any}    The length of the input
 */
const length = function (input: any) {
    if (typeof input === 'object' && !utils.isArray(input)) {
        let keys = utils.keys(input);
        return keys.length;
    }
    if (input.hasOwnProperty('length')) {
        return input.length;
    }
    return '';
};

/**
 * Return the input in all lowercase letters.
 *
 * @example
 * {{ "FOOBAR"|lower }}
 * // => foobar
 *
 * @example
 * // myObj = { a: 'FOO', b: 'BAR' }
 * {{ myObj|lower|join('') }}
 * // => foobar
 *
 * @param  input
 * @return {any}    Returns the same type as the input.
 */
const lower = function (input: any): any {
    const out = iterateFilter.apply(lower, arguments);
    if (out !== undefined) {
        return out;
    }

    return input.toString().toLowerCase();
};

/**
 * Deprecated in favor of <a href="#safe">safe</a>.
 */
const raw = function (input) {
    return safe(input);
};
raw['safe'] = true;


/**
 * Returns a new string with the matched search pattern replaced by the given replacement string. Uses JavaScript's built-in String.replace() method.
 *
 * @example
 * // my_var = 'foobar';
 * {{ my_var|replace('o', 'e', 'g') }}
 * // => feebar
 *
 * @example
 * // my_var = "farfegnugen";
 * {{ my_var|replace('^f', 'p') }}
 * // => parfegnugen
 *
 * @example
 * // my_var = 'a1b2c3';
 * {{ my_var|replace('\w', '0', 'g') }}
 * // => 010203
 *
 * @param   input
 * @param   search          String or pattern to replace from the input.
 * @param   replacement     String to replace matched pattern.
 * @param   [flags]         Regular Expression flags. 'g': global match, 'i': ignore case, 'm': match over multiple lines
 * @return  {string}        Replaced string.
 */
const replace = function (input: string, search: string, replacement: string, flags: string): string {
    const r = new RegExp(search, flags);
    return input.replace(r, replacement);
};

/**
 * Reverse sort the input. This is an alias for <code data-language="swig">{{ input|sort(true) }}</code>.
 *
 * @example
 * // val = [1, 2, 3];
 * {{ val|reverse }}
 * // => 3,2,1
 *
 * @param  input
 * @return {array}  Reversed array. The original input object is returned if it was not an array.
 */
const reverse = function (input: any[]): any[] {
    return sort(input, true);
};

/**
 * Forces the input to not be auto-escaped. Use this only on content that you know is safe to be rendered on your page.
 *
 * @example
 * // my_var = "<p>Stuff</p>";
 * {{ my_var|safe }}
 * // => <p>Stuff</p>
 *
 * @param   input
 * @return  {any}   The input exactly how it was given, regardless of autoescaping status.
 */
const safe = function (input: any): any {
    return input;
}
safe['safe'] = true;

/**
 * Sort the input in an ascending direction.
 * If given an object, will return the keys as a sorted array.
 * If given a string, each character will be sorted individually.
 *
 * @example
 * // val = [2, 6, 4];
 * {{ val|sort }}
 * // => 2,4,6
 *
 * @example
 * // val = 'zaq';
 * {{ val|sort }}
 * // => aqz
 *
 * @example
 * // val = { bar: 1, foo: 2 }
 * {{ val|sort(true) }}
 * // => foo,bar
 *
 * @param   input
 * @param   [reverse=false] Output is given reverse-sorted if true.
 * @return  {array}        Sorted array;
 */
const sort = function (input: any, reverse: boolean = false): any[] {
    let out, clone;
    if (utils.isArray(input)) {
        clone = utils.extend([], input);
        out = clone.sort();
    } else {
        switch (typeof input) {
            case 'object':
                out = utils.keys(input).sort();
                break;
            case 'string':
                out = input.split('');
                if (reverse) {
                    return out.reverse().join('');
                }
                return out.sort().join('');
        }
    }

    if (out && reverse) {
        return out.reverse();
    }

    return out || input;
};

/**
 * Strip HTML tags.
 *
 * @example
 * // stuff = '<p>foobar</p>';
 * {{ stuff|striptags }}
 * // => foobar
 *
 * @param   input
 * @return  {any}   Returns the same object as the input, but with all string values stripped of tags.
 */
const striptags = function (input: any): any {
    const out = iterateFilter.apply(striptags, arguments);
    if (out !== undefined) {
        return out;
    }

    return input.toString().replace(/(<([^>]+)>)/ig, '');
};

/**
 * Capitalizes every word given and lower-cases all other letters.
 *
 * @example
 * // my_str = 'this is soMe text';
 * {{ my_str|title }}
 * // => This Is Some Text
 *
 * @example
 * // my_arr = ['hi', 'this', 'is', 'an', 'array'];
 * {{ my_arr|title|join(' ') }}
 * // => Hi This Is An Array
 *
 * @param   input
 * @return  {any}   Returns the same object as the input, but with all words in strings title-cased.
 */
const title = function (input: any): any {
    const out = iterateFilter.apply(title, arguments);
    if (out !== undefined) {
        return out;
    }

    return input.toString().replace(/\w\S*/g, function (str) {
        return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
    });
};

/**
 * Remove all duplicate items from an array.
 *
 * @example
 * // my_arr = [1, 2, 3, 4, 4, 3, 2, 1];
 * {{ my_arr|uniq|join(',') }}
 * // => 1,2,3,4
 *
 * @param  {array}  input
 * @return {array}        Array with unique items. If input was not an array, the original item is returned untouched.
 */
const uniq = function (input: any[]): any[] | '' {
    const result = [];

    if (!input || !utils.isArray(input)) {
        return '';
    }

    input.forEach((v) => {
        if (result.indexOf(v) === -1) {
            result.push(v);
        }
    })

    return result;
};

/**
 * Convert the input to all uppercase letters. If an object or array is provided, all values will be uppercased.
 *
 * @example
 * // my_str = 'tacos';
 * {{ my_str|upper }}
 * // => TACOS
 *
 * @example
 * // my_arr = ['tacos', 'burritos'];
 * {{ my_arr|upper|join(' & ') }}
 * // => TACOS & BURRITOS
 *
 * @param   input
 * @return  {any}        Returns the same type as the input, with all strings upper-cased.
 */
const upper = function (input: any): any {
    const out = iterateFilter.apply(upper, arguments);
    if (out !== undefined) {
        return out;
    }

    return input.toString().toUpperCase();
};

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
    addslashes,
    capitalize,
    date,
    "default": _default,
    e: escape,
    escape,
    first,
    groupBy,
    join,
    json,
    json_encode: json,
    last,
    length,
    lower,
    raw,
    replace,
    reverse,
    safe,
    sort,
    striptags,
    title,
    uniq,
    upper,
    url_encode,
    url_decode
}