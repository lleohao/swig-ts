import * as utils from './utils';
import * as lexer from './lexer';
import { Swig, SwigOptions } from './swig';
import { LexerToken } from './lexer';

const _t = lexer.types;
const _reserved = ['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with'];

/**
 * Makes a string safe for regular expression.
 * 
 * @param {string} str 
 * @returns 
 * @private
 */
function escapeRegExp(str: string) {
    return str.replace(/[\-\/\\\^$*+?.()|\[\]{}]/, '\\$&');
}

class TokenParser {
    out: any[];
    state: any[];
    filterApplyIdx: any[];
    private parsers = {};
    filename: string;
    private line: number;
    private filters: Object;
    private escape: boolean;

    constructor(tokens: LexerToken[], filters: Object, autoescape: boolean, line: number, filename: string = '') {
        this.line = line;
        this.filters = filters;
        this.filename = filename;
        this.escape = autoescape;
    }

    parse() {
        return [];
    }

}

export const parse = function (swig: Swig, source: string, opts: SwigOptions, tags: any, filters: Object) {
    source = source.replace(/\r\n/g, '\n');
    let escape = opts.autoescape,
        tagOpen = (<string[]>opts.tagControls)[0],
        tagClose = (<string[]>opts.tagControls)[1],
        varOpen = (<string[]>opts.varControls)[0],
        varClose = (<string[]>opts.varControls)[1],
        escapedTagOpen = escapeRegExp(tagOpen),
        escapedTagClose = escapeRegExp(tagClose),
        escapedVarOpen = escapeRegExp(varOpen),
        escapedVarClose = escapeRegExp(varClose),
        tagStrip = new RegExp('^' + escapedTagOpen + '-?\\s*-?|-?\\s*-?' + escapedTagClose + '$', 'g'),
        tagStripBefore = new RegExp('^' + escapedTagOpen + '-'),
        tagStripAfter = new RegExp('-' + escapedTagClose + '$'),
        varStrip = new RegExp('^' + escapedVarOpen + '-?\\s*-?|-?\\s*-?' + escapedVarClose + '$', 'g'),
        varStripBefore = new RegExp('^' + escapedVarOpen + '-'),
        varStripAfter = new RegExp('-' + escapedVarClose + '$'),
        cmtOpen = (<string[]>opts.cmtControls)[0],
        cmtClose = (<string[]>opts.cmtControls)[1],
        anyChar = '[\\s\\S]*?',
        splitter = new RegExp(
            '(' +
            escapedTagOpen + anyChar + escapedTagClose + '|' +
            escapedVarOpen + anyChar + escapedVarClose + '|' +
            escapeRegExp(cmtOpen) + anyChar + escapeRegExp(cmtClose) +
            ')'
        ),
        line = 1,
        stack: any[] = [],
        parent = null,
        tokens = [],
        blocks = {},
        inRaw = false,
        stripNext;

    /**
     * Parse a variable.
     * 
     * @param {string} str  String contents of the variable, between <i>{{</i> and <i>}}</i>
     * @param {number} line The line number that this variable starts on.
     * @return {VarToken}   Parsed variable token object.
     */
    function parseVariable(str: string, line: number) {
        let tokens = lexer.read(utils.strip(str)),
            parser,
            out: string;

        parser = new TokenParser(tokens, filters, escape, line, opts.filename);
        out = parser.parse().join('');

        if (parser.state.length) {
            utils.throwError(`Unable to parse "${str}"`, line, opts.filename);
        }

        return {
            complie: function () {
                return '_output +=' + out + ';\n';
            }
        };
    }

    /**
     * Parse a tag.
     * 
     * @param {string} str  String contents of the variable, between <i>{%</i> and <i>%}</i>
     * @param {number} line The line number that this variable starts on.
     * @return {TagToken} Parsed token object.
     */
    function parseTag(str: string, line: number) {
        let tokens, parser, chunks, tagName, tag, args, last;

        if (utils.startWith(str, 'end')) {
            last = stack[stack.length - 1];
            if (last && last.name === str.split(/\s+/)[0].replace(/^end/, '') && last.ends) {
                switch (last.name) {
                    case 'autoescape':
                        escape = opts.autoescape;
                        break;
                    case 'raw':
                        inRaw = false;
                        break;
                }
                stack.pop();
                return;
            }

            if (!inRaw) {
                utils.throwError(`Unexpected end of tag ${str.replace(/^end/, '')}`, line, opts.filename);
            }
        }

        if (inRaw) {
            return;
        }

        chunks = str.split(/\s+(.+)?/);
        tagName = <string>chunks.shift();

        if (!tags.hasOwnProperty(tagName)) {
            utils.throwError(`Unexpected tag "${str}"`, line, opts.filename);
        }

        tokens = lexer.read(utils.strip(chunks.join('')));
        parser = new TokenParser(tokens, filters, false, line, opts.filename);
        tag = tags[tagName];

        if (!tag.parse(chunks[1], line, parser, _t, stack, opts, swig)) {
            utils.throwError('Unexpected tag "' + tagName + '"', line, opts.filename);
        }

        parser.parse();
        args = parser.out;

        switch (tagName) {
            case 'autoescape':
                escape = (args[0] !== 'false') ? args[0] : false;
                break;
            case 'raw':
                inRaw = true;
                break;
        }

        return {
            block: !!tags[tagName].block,
            compile: tag.compile,
            args: args,
            content: [],
            ends: tag.ends,
            name: tagName
        }
    }

    function stripPrevToken(token: any) {
        if (typeof token === 'string') {
            token = token.replace(/\s*$/, '');
        }

        return token;
    }
}