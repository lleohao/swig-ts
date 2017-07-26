import { CompileFunction, ParseFunction } from './index';
import { TYPES as types } from '../lexer';
import filters from '../filters';


/**
 * Apply a filter to an entire block of template.
 * 
 * @alias filter
 * 
 * @example
 * {% filter uppercase %}oh, hi, {{ name }}{% endfilter %}
 * // => OH HI, LLEO  
 * @example
 * {% filter replace(".", "!", "g") %}Hi. My name is Paul.{% endfilter %}
 * // => Hi! My name is Paul!
 * 
 * @param {function} filter  The filter that should be applied to the contents of the tag.
 */

const compile: CompileFunction = function (compiler, args, contents, parents, options, blockName) {
    let filter = args.shift().replace(/\($/, ''),
        val = '(function () {\n' +
            '  var _output = "";\n' +
            compiler(contents, parents, options, blockName) +
            '  return _output;\n' +
            '})()';

    if (args[args.length - 1] === ')') {
        args.pop();
    }

    let _argsStr = (args.length) ? ', ' + args.join('') : '';
    return '_output += _filters["' + filter + '"](' + val + _argsStr + ');\n';
}

const parse: ParseFunction = function (str, line, parser, stack, opts) {
    let filter;

    function check(filter) {
        if (!(filters as Object).hasOwnProperty(filter)) {
            throw new Error('Filter "' + filter + '" does not exist on line ' + line + '.');
        }
    }

    parser.on(types.FUNCTION, function (token) {
        if (!filter) {
            filter = token.match.replace(/\($/, '');
            check(filter);
            this.out.push(token.match);
            this.state.push(token.type);
            return;
        }
        return true;
    });

    parser.on(types.VAR, function (token) {
        if (!filter) {
            filter = token.match;
            check(filter);
            this.out.push(filter);
            return;
        }
        return true;
    });

    return true;
};

export default {
    compile: compile,
    parse: parse,
    ends: true
}