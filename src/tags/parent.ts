import { CompileFunction, ParseFunction } from './index';
import { TYPES as types } from '../lexer';

/**
 * Inject the content from the parent template's block of the same name into the current block.
 *
 * See <a href="#inheritance">Template Inheritance</a> for more information.
 *
 * @alias parent
 *
 * @example
 * {% extends "./foo.html" %}
 * {% block content %}
 *   My content.
 *   {% parent %}
 * {% endblock %}
 *
 */

const compile: CompileFunction = function (compiler, args, content, parents, options, blockName) {
    if (!parents || !parents.length) {
        return '';
    }

    let parentFile = args[0],
        breaker = true,
        l = parents.length,
        i = 0,
        parent,
        block;

    for (i; i < l; i += 1) {
        parent = parents[i];
        if (!parent.blocks || !parent.blocks.hasOwnProperty(blockName)) {
            continue;
        }
        if (breaker && parentFile !== parent.name) {
            block = parent.blocks[blockName];
            return block.compile(compiler, [blockName], block.content, parents.slice(i + 1), options) + '\n';
        }
    }
};

const parse: ParseFunction = function (sre, line, parser, stack, opts) {
    parser.on('*', function (token) {
        throw new Error('Unexpected argument "' + token.match + '" on line ' + line + '.');
    })

    parser.on('end', function (token) {
        this.out.push(opts.filename);
    })

    return true;
};

export default {
    compile: compile,
    parse: parse
}