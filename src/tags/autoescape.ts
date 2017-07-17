import { CompileFunction, ParseFunction } from './index';
import utils from '../utils';
const strings = ['html', 'js'];

/**
 * Control auto-escapeing of variable output from within your templates.
 * 
 * @alias autoescape
 * 
 * @example 
 * // myvar = '<foo>';
 * {% autoescape true %}{{ myvar }}{% endautoescape %}
 * // ==> &lt;foo&gt;
 * {% autoescape false %}{{ myvar }}{% endautoescape %}
 * // => <foo>
 * 
 * @param {boolean|string} control One of 'true', 'false', 'js', 'html'.
 */

const compile: CompileFunction = function (compiler, args, contents, parents, options, blockName) {
    return compiler(contents, parents, options, blockName);
};

const parse: ParseFunction = function (str, line, parser, types, stack, opts) {
    let matched;
    parser.on('*', function (token) {
        if (!matched &&
            (token.type === types.BOOL) ||
            (token.type === types.STRING && strings.indexOf(token.match) === -1)) {
            this.out.push(token.match);
            matched = true;
            return;
        }
        utils.throwError('Unexpected token "' + token.match + '" in autoescape tag', line, opts.filename);
    })

    return true;
}

export default {
    compile: compile,
    parse: parse,
    ends: true
}