import { CompileFunction, ParseFunction } from './index';
import { TYPES as types } from '../lexer';
import utils from '../utils';
import parser from '../parser';

/**
 * Allows you to import macros from another file directly into your current context.
 * The import tag is specifically designed for importing macros into your template with a specific context scope. This is very useful for keeping your macros from overriding template context that is being injected by your server-side page generation.
 *
 * @alias import
 *
 * @example
 * {% import './formmacros.html' as form %}
 * {{ form.input("text", "name") }}
 * // => <input type="text" name="name">
 *
 * @example
 * {% import "../shared/tags.html" as tags %}
 * {{ tags.stylesheet('global') }}
 * // => <link rel="stylesheet" href="/global.css">
 *
 * @param {string|var}  file      Relative path from the current template file to the file to import macros from.
 * @param {literal}     as        Literally, "as".
 * @param {literal}     varname   Local-accessible object name to assign the macros to.
 */
const compile: CompileFunction = function (compiler, args) {
    let ctx = args.pop(),
        allMacros = utils.map(args, function (arg) {
            return arg.name;
        }).join('|'),
        out = '_ctx.' + ctx + ' = {}\n var _output = "";\n',
        replacements = utils.map(args, function (arg) {
            return {
                ex: new RegExp('_ctx.' + arg.name + '(\\W)(?!' + allMacros + ')', 'g'),
                re: '_ctx.' + ctx + '.' + arg.name + '$1'
            };
        });

    utils.each(args, function (arg) {
        let c = arg.compiled;
        utils.each(replacements, function (re) {
            c = c.replace(re.ex, re.re);
        });
        out += c;
    })

    return out;
}

const parse: ParseFunction = function (str, line, _parser, stack, opts, swig) {
    let compiler = parser.compile,
        parseOpts = { resolveFrom: opts.filename },
        compileOpts = utils.extend({}, opts, parseOpts),
        tokens,
        ctx;

    _parser.on(types.STRING, function (token) {
        if (!tokens) {
            tokens = swig.parseFile(token.match.replace(/^("|')|("|')$/g, ''), parseOpts).tokens;
            utils.each(tokens, (token) => {
                var out = '',
                    macroName;
                if (!token || token.name !== 'macro' || !token.compile) {
                    return;
                }
                macroName = token.args[0];
                out += token.compile(compiler, token.args, token.content, [], compileOpts) + '\n';
                this.out.push({ compiled: out, name: macroName });
            });
            return;
        }

        throw new Error('Unexpected string ' + token.match + ' on line ' + line + '.');
    })

    _parser.on(types.VAR, function (token) {
        if (!tokens || ctx) {
            throw new Error('Unexpected variable "' + token.match + '" on line ' + line + '.');
        }

        if (token.match === 'as') {
            return;
        }

        ctx = token.match;
        this.out.push(ctx);
        return false;
    });

    return true;
}

export default {
    compile: compile,
    parse: parse,
    block: true
}