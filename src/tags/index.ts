import raw from './raw';
import _if from './if';
import elseif from './esleif';
import _else from './else';
import block from './block';
import autoescape from './autoescape';
import _extends from './extends';

import { SwigOptions } from '../swig';
import { TokenParser } from '../parser';

export interface TagToken {
    compile: CompileFunction;
    parse: ParseFunction;
    ends?: boolean;
    block?: boolean;
}

export interface CompileFunction {
    /**
     * Compile callback for VarToken and TagToken objects.
     * @callback compile
     *
     * @example
     * exports.compile = function (compiler, args, content, parents, options, blockName) {
     *   if (args[0] === 'foo') {
     *     return compiler(content, parents, options, blockName) + '\n';
     *   }
     *   return '_output += "fallback";\n';
     * };
     *
     * @param {parserCompiler} compiler
     * @param {array} [args] Array of parsed arguments on the for the token.
     * @param {array} [content] Array of content within the token.
     * @param {array} [parents] Array of parent templates for the current template context.
     * @param {SwigOpts} [options] Swig Options Object
     * @param {string} [blockName] Name of the direct block parent, if any.
     */
    (compiler, args: string[], content: any[], parents: any[], options: SwigOptions, blockName: string): string | void;
}

export interface ParseFunction {
    (str: string, line: number, parser: TokenParser, types: any, stack: any[], opts?: SwigOptions): boolean;
}

export interface Tags {
    [key: string]: TagToken;
}

export default {
    raw: raw,
    "if": _if,
    "else": _else,
    elseif: elseif,
    elif: elseif,
    block: block,
    autoescape: autoescape,
    "extends": _extends
}