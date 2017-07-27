import autoescape from './autoescape';
import block from './block';
import _else from './else';
import elseif from './esleif';
import _extends from './extends';
import filter from './filter';
import _for from './for';
import _if from './if';
import _import from './import';
import include from './include';
import macro from './macro';
import parent from './parent';
import raw from './raw';
import set from './set';
import spaceless from './spaceless';

import { SwigOptions, Swig } from '../swig';
import { TokenParser, ParsedToken } from '../parser';


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
    (compiler, args: ParsedToken[] | string[], content: any[], parents: any[], options: SwigOptions, blockName: string): string | void;
}

export interface ParseFunction {
    (str: string, line: number, parser: TokenParser, stack?: any[], opts?: SwigOptions, swig?: Swig): boolean;
}

export interface Tags {
    [key: string]: TagToken;
}

export default {
    autoescape: autoescape,
    block: block,
    "else": _else,
    elseif: elseif,
    elif: elseif,
    "extends": _extends,
    filter: filter,
    "for": _for,
    "if": _if,
    "import": _import,
    include: include,
    macro: macro,
    parent: parent,
    raw: raw,
    set: set,
    spaceless: spaceless
}