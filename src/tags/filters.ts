import { CompileFunction, ParseFunction } from './index';
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
        val = `(function () {
                    var _output = "";
                    ${compiler(contents, parents, options, blockName)}
                    return _output;
                })();`;

    if (args[args.length - 1] === ')') {
        args.pop();
    }

    let _argsStr = (args.length) ? ', ' + args.join('') : '';
    return `_output += _filters["${filters}"](${val + _argsStr});`;
}

const parse: ParseFunction = function (str, line, parser, types, stack, opts) {

    return true;
}