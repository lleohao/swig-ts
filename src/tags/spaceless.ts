import { CompileFunction, ParseFunction } from './index';
import { TYPES as types } from '../lexer';
import utils from '../utils';

/**
 * Attempts to remove whitespace between HTML tags. Use at your own risk.
 *
 * @alias spaceless
 *
 * @example
 * {% spaceless %}
 *   {% for num in foo %}
 *   <li>{{ loop.index }}</li>
 *   {% endfor %}
 * {% endspaceless %}
 * // => <li>1</li><li>2</li><li>3</li>
 *
 */
const compile: CompileFunction = function (compiler, args, content, parents, options, blockName) {
    let out = compiler(content, parents, options, blockName);
    out += '_output = _output.replace(/^\\s+/, "")\n' +
        '   .replace(/>\\s+</g, "><")\n' +
        '   .replace(/\\s+$/, "");\n';

    return out;
}

const parse: ParseFunction = function (str, line, parser) {
    parser.on('*', function (token) {
        throw new Error('Unexpected token "' + token.match + '" on line ' + line + '.');
    });


    return true;
}

export default {
    compile: compile,
    parse: parse,
    ends: true
}