import { CompileFunction, ParseFunction } from './index';
import { TYPES as types } from '../lexer';

const ignore = 'ignore',
    missing = 'missing',
    only = 'only';

/**
 * Includes a template partial in place. The template is rendered within the current locals variable context.
 *
 * @alias include
 *
 * @example
 * // food = 'burritos';
 * // drink = 'lemonade';
 * {% include "./partial.html" %}
 * // => I like burritos and lemonade.
 *
 * @example
 * // my_obj = { food: 'tacos', drink: 'horchata' };
 * {% include "./partial.html" with my_obj only %}
 * // => I like tacos and horchata.
 *
 * @example
 * {% include "/this/file/does/not/exist" ignore missing %}
 * // => (Nothing! empty string)
 *
 * @param compiler
 * @param args
 */

const compile: CompileFunction = function (compiler, args: string[]) {
    let file = args.shift(),
        onlyIdx = args.indexOf(only),
        onlyCtx = onlyIdx !== -1 ? args.splice(onlyIdx, 1) : false,
        parentFile = (args.pop() || '').replace(/\\/g, '\\\\'),
        ignore = args[args.length - 1] === missing ? (args.pop()) : false,
        w = args.join('');

    return (ignore ? '  try {\n' : '') +
        '_output += _swig.compileFile(' + file + ', {' +
        'resolveFrom: "' + parentFile + '"' +
        '})(' +
        ((onlyCtx && w) ? w : (!w ? '_ctx' : '_utils.extend({}, _ctx, ' + w + ')')) +
        ');\n' +
        (ignore ? '} catch (e) {}\n' : '');
};

const parse: ParseFunction = function (str, line, parser, stack, opts) {
    let file, w;
    parser.on(types.STRING, function (token) {
        if (!file) {
            file = token.match;
            this.out.push(file);
            return;
        }

        return true;
    });

    parser.on(types.VAR, function (token) {
        if (!file) {
            file = token.match;
            return true;
        }

        if (!w && token.match === 'with') {
            w = true;
            return;
        }

        if (w && token.match === only && this.prevToken.match !== 'with') {
            this.out.push(token.match);
            return;
        }

        if (token.match === ignore) {
            return false;
        }

        if (token.match === missing) {
            if (this.prevToken.match !== ignore) {
                throw new Error('Unexpected token "' + missing + '" on line ' + line + '.');
            }
            this.out.push(token.match);
            return false;
        }

        if (this.prevToken.match === ignore) {
            throw new Error('Expected "' + missing + '" on line ' + line + ' but found "' + token.match + '".');
        }

        return true;
    });

    parser.on('end', function () {
        this.out.push(opts.filename || null);
    });

    return true;
};

export default {
    compile: compile,
    parse: parse
}