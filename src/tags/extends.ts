import { CompileFunction, ParseFunction } from './index';
/**
 * Makes the current template extend a parent template. This tag must be the first item in your template.
 *
 * See <a href="#inheritance">Template Inheritance</a> for more information.
 *
 * @alias extends
 *
 * @example
 * {% extends "./layout.html" %}
 *
 * @param {string} parentFile  Relative path to the file that this template extends.
 */
const compile: CompileFunction = function (compiler, args, content, parents, options, blockName) { };

const parse: ParseFunction = function () {
    return true;
}

export default {
    compile: compile,
    parse: parse,
    ends: false
}