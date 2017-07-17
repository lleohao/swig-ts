import { CompileFunction, ParseFunction } from './index';
import { TYPES as types } from '../lexer';

/**
 * Defines a block in a template that can be overridden by a template extending this one and/or will override the current template's parent template block of the same name.
 * 
 * @alias block
 * 
 * @example
 * {% block body %}...{% endblock %}
 * 
 * @param {literal}  name   Name of the block for use in parent and extended templates.
 */
const compile: CompileFunction = function (compiler, args, content, parents, options) {
    return compiler(content, parents, options, args.join(''));
};

const parse: ParseFunction = function (str, line, parser) {
    parser.on('*', function (token) {
        this.out.push(token.match);
    })
    return true;
}

export default {
    compile: compile,
    parse: parse,
    ends: true,
    block: true
}