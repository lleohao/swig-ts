import utils from './utils';
import lexer, { TYPES } from './lexer';
import { Swig, SwigOptions } from './swig';
import { LexerToken } from './lexer';
import { Filters } from './filters';
import { Tags } from './tags';

const _t = TYPES;
const _reserved = ['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with'];

interface Parsers {
    [key: string]: Function;
}

export interface ParsedToken {
    name: string;
    parent: string,
    tokens: LexerToken[],
    blocks: { [key: string]: any }
}

interface Token {
    name?: string,
    args?: string[],
    content?: Token[],
    block?: boolean;
    compile: () => string
}

/**
 * Makes a string safe for regular expression.
 * 
 * @param  str 
 * @returns 
 * @private
 */
function escapeRegExp(str: string) {
    return str.replace(/[\-\/\\\^$*+?.()|\[\]{}]/, '\\$&');
}

/**
 * Parse strings of variables ang tags into tokens for future compilation.
 * 
 * @class TokenParser
 */
export class TokenParser {
    out: string[] = [];
    state: any[] = [];
    filterApplyIdx: number[] = [];
    filename: string;
    line: number;
    filters: Filters;
    escape: boolean;
    private parsers: Parsers = {};
    private tokens: LexerToken[];
    private isLast: boolean = false;
    private prevToken: LexerToken;
    private autoescape: boolean;

    /**
     * Creates an instance of TokenParser.
     * 
     * @param tokens      Pre-split tokens read by the Lexer.
     * @param filters     Keyed object of filters that may be applied to variables.
     * @param autoescape  Whether or not this shuould be autoescaped.
     * @param line        Beginning line number for the firsr token. 
     * @param [filename]  Name of the file being parsed.
     */
    constructor(tokens: LexerToken[], filters: Filters, autoescape: boolean, line: number, filename?: string) {
        this.line = line;
        this.filters = filters;
        this.filename = filename;
        this.autoescape = this.escape = autoescape;
        this.tokens = tokens;
    }

    parse() {
        const tokens = this.tokens;

        if (this.parsers.start) {
            this.parsers.start.call(this);
        }
        tokens.forEach((token, i) => {
            let prevToken = token[i - 1];
            this.isLast = (i === (tokens.length - 1));
            if (prevToken) {
                while (prevToken.type === _t.WHITESPACE) {
                    i -= 1;
                    prevToken = tokens[i - 1];
                }
            }
            this.prevToken = prevToken;
            this.parseToken(token);
        });
        if (this.parsers.end) {
            this.parsers.end.call(this);
        }

        if (this.escape) {
            this.filterApplyIdx = [0];
            if (typeof this.escape === 'string') {
                this.parseToken({ type: _t.FILTER, match: 'e' });
                this.parseToken({ type: _t.COMMA, match: ',' });
                this.parseToken({ type: _t.STRING, match: String(this.autoescape) });
                this.parseToken({ type: _t.PARENCLOSE, match: ')' });
            } else {
                this.parseToken({ type: _t.FILTEREMPTY, match: 'e' });
            }
        }

        return this.out;
    }

    /**
     * Set a custom method to be called when token type is found.
     * 
     * @example
     * parser.on(_types.STRING, function(token) {
     *      this.out.push(token.match);
     * })
     * 
     * @example
     * parser.on('start', function () {
     *   this.out.push('something at the beginning of your args')
     * });
     * parser.on('end', function () {
     *   this.out.push('something at the end of your args');
     * });
     * 
     * @param type    Token type ID. Found in the Lexer.  
     * @param fn      Callbacak function. Return true to continue executing the default parsing function.
     */
    on(type: number | '*' | 'end' | 'start', fn: (token: LexerToken) => void) {
        this.parsers[type] = fn;
    }

    /**
     * Parse a single token.
     * 
     * @memberof TokenParser
     */
    parseToken(token: LexerToken) {
        let fn = this.parsers[token.type] || this.parsers['*'],
            match = token.match,
            prevToken = this.prevToken,
            prevTokenType = prevToken ? prevToken.type : null,
            lastState = (this.state.length) ? this.state[this.state.length - 1] : null,
            temp;

        if (fn && typeof fn === 'function') {
            if (!fn.call(this, token)) {
                return;
            }
        }

        if (lastState && prevToken &&
            lastState === _t.FILTER &&
            prevTokenType === _t.FILTER &&
            token.type !== _t.PARENCLOSE &&
            token.type !== _t.COMMA &&
            token.type !== _t.OPERATOR &&
            token.type !== _t.FILTER &&
            token.type !== _t.FILTEREMPTY) {
            this.out.push(', ');
        }

        if (lastState && lastState === _t.METHODOPEN) {
            this.state.pop();
            if (token.type !== _t.PARENCLOSE) {
                this.out.push(', ');
            }
        }

        switch (token.type) {
            case _t.WHITESPACE:
                break;

            case _t.STRING:
                this.filterApplyIdx.push(this.out.length);
                this.out.push(match.replace(/\\/g, '\\\\'));
                break;

            case _t.NUMBER:
            case _t.BOOL:
                this.filterApplyIdx.push(this.out.length);
                this.out.push(match);
                break;

            case _t.FILTER:
                if (!this.filters.hasOwnProperty(match) || typeof this.filters[match] !== 'function') {
                    utils.throwError(`Invaliad filter "${match}"`, this.line, this.filename);
                }
                this.escape = this.filters[match].safe ? false : this.escape;
                this.out.splice(this.filterApplyIdx[this.filterApplyIdx.length - 1], 0, '_filters["' + match + '"](');
                this.state.push(token.type);
                break;

            case _t.FILTEREMPTY:
                if (!this.filters.hasOwnProperty(match) || typeof this.filters[match] !== 'function') {
                    utils.throwError(`Invaliad filter "${match}"`, this.line, this.filename);
                }
                this.escape = this.filters[match].safe ? false : this.escape;
                this.out.splice(this.filterApplyIdx[this.filterApplyIdx.length - 1], 0, '_filters["' + match + '"](');
                this.out.push(')');
                break;

            case _t.FUNCTION:
            case _t.FUNCTIONEMPTY:
                this.out.push('((typeof _ctx.' + match + ' !== "undefined") ? _ctx.' + match +
                    ' : ((typeof ' + match + ' !== "undefined") ? ' + match +
                    ' : _fn))(');
                this.escape = false;
                if (token.type === _t.FUNCTIONEMPTY) {
                    this.out[this.out.length - 1] = this.out[this.out.length - 1] + ')';
                } else {
                    this.state.push(token.type);
                }
                this.filterApplyIdx.push(this.out.length - 1);
                break;

            case _t.PARENOPEN:
                this.state.push(token.type);
                if (this.filterApplyIdx.length) {
                    this.out.splice(this.filterApplyIdx[this.filterApplyIdx.length - 1], 0, '(');
                    if (prevToken && prevTokenType === _t.VAR) {
                        temp = prevToken.match.split('.').slice(0, -1);
                        this.out.push(' || _fn).call' + this.checkMatch(temp));
                        this.state.push(_t.METHODOPEN);
                        this.escape = false;
                    } else {
                        this.out.push(' || _fn)(');
                    }
                    this.filterApplyIdx.push(this.out.length - 3);
                } else {
                    this.out.push('(');
                    this.filterApplyIdx.push(this.out.length - 1);
                }
                break;

            case _t.PARENCLOSE:
                temp = this.state.pop();
                if (temp !== _t.PARENOPEN && temp !== _t.FUNCTION && temp !== _t.FILTER) {
                    utils.throwError('Mismatched nesting state', this.line, this.filename);
                }

                this.out.push(')');
                this.filterApplyIdx.pop();

                if (temp !== _t.FILTER) {
                    this.filterApplyIdx.pop();
                }
                break;

            case _t.COMMA:
                if (lastState !== _t.FUNCTION &&
                    lastState !== _t.FILTER &&
                    lastState !== _t.ARRAYOPEN &&
                    lastState !== _t.CURLYOPEN &&
                    lastState !== _t.PARENOPEN &&
                    lastState !== _t.COLON) {
                    utils.throwError('Unexpected comma', this.line, this.filename);
                }
                if (lastState === _t.COLON) {
                    this.state.pop();
                }
                this.out.push(', ');
                this.filterApplyIdx.pop();
                break;

            case _t.LOGIC:
            case _t.COMPARATOR:
                if (!prevToken ||
                    prevTokenType === _t.COMMA ||
                    prevTokenType === token.type ||
                    prevTokenType === _t.BRACKETOPEN ||
                    prevTokenType === _t.CURLYOPEN ||
                    prevTokenType === _t.PARENOPEN ||
                    prevTokenType === _t.FUNCTION) {
                    utils.throwError('Unexpected logic', this.line, this.filename);
                }
                this.out.push(match);
                break

            case _t.NOT:
                this.out.push(match);
                break;

            case _t.VAR:
                this.parseVar(token, match, lastState);
                break;

            case _t.BRACKETOPEN:
                if (!prevToken ||
                    (prevTokenType !== _t.VAR &&
                        prevTokenType !== _t.BRACKETCLOSE &&
                        prevTokenType !== _t.PARENCLOSE)) {
                    this.state.push(_t.ARRAYOPEN);
                    this.filterApplyIdx.push(this.out.length);
                } else {
                    this.state.push(token.type);
                }
                this.out.push('[');
                break;
            case _t.BRACKETCLOSE:
                temp = this.state.pop();
                if (temp !== _t.BRACKETOPEN && temp !== _t.ARRAYOPEN) {
                    utils.throwError('Unexpected closing square bracket', this.line, this.filename);
                }
                this.out.push(']');
                this.filterApplyIdx.pop();
                break;

            case _t.CURLYOPEN:
                this.state.push(token.type);
                this.out.push('{');
                this.filterApplyIdx.push(this.out.length - 1);
                break;

            case _t.COLON:
                if (lastState !== _t.CURLYOPEN) {
                    utils.throwError('Unexpected colon', this.line, this.filename);
                }
                this.state.push(token.type);
                this.out.push(':');
                this.filterApplyIdx.pop();
                break;

            case _t.CURLYCLOSE:
                if (lastState === _t.COLON) {
                    this.state.pop();
                }
                if (this.state.pop() !== _t.CURLYOPEN) {
                    utils.throwError('Unexpected closing curly brace', this.line, this.filename);
                }
                this.out.push('}');

                this.filterApplyIdx.pop();
                break;

            case _t.DOTKEY:
                if (!prevToken || (
                    prevTokenType !== _t.VAR &&
                    prevTokenType !== _t.BRACKETCLOSE &&
                    prevTokenType !== _t.DOTKEY &&
                    prevTokenType !== _t.PARENCLOSE &&
                    prevTokenType !== _t.FUNCTIONEMPTY &&
                    prevTokenType !== _t.FILTEREMPTY &&
                    prevTokenType !== _t.CURLYCLOSE
                )) {
                    utils.throwError('Unexpected key "' + match + '"', this.line, this.filename);
                }
                this.out.push('.' + match);
                break;

            case _t.OPERATOR:
                this.out.push(' ' + match + ' ');
                this.filterApplyIdx.pop();
                break;
        }
    }

    /**
     * Parse variable token
     * @param token       Lexer token object. 
     * @param match       Shortcut for token match.
     * @param lastState   Lexer token type state.
     */
    parseVar(token: LexerToken, match: string, lastState: number) {
        const matchArr = match.split('.');

        if (_reserved.indexOf(matchArr[0]) !== -1) {
            utils.throwError(`Reserved keyword "${matchArr[0]}" attempted to be used as a variable`, this.line, this.filename);
        }

        this.filterApplyIdx.push(this.out.length);
        if (lastState === _t.CURLYOPEN) {
            if (matchArr.length > 1) {
                utils.throwError('Unexpected dot', this.line, this.filename);
            }

            this.out.push(matchArr[0]);
            return;
        }

        this.out.push(this.checkMatch(matchArr));
    }

    /**
     * Return contextual dot-check string for match.
     * 
     * 
     * @param match 
     */
    checkMatch(match: string[]): string {
        let temp = match[0], result;

        // Verify that the variable is present
        function checkDot(ctx: string) {
            let c = ctx + temp,
                m = match,
                build = '';

            build = `(typeof ${c} !== "undefined" && ${c} !== null`;
            m.forEach((v, i) => {
                if (i === 0) {
                    return;
                }
                build += ` && ${c}.${v} !== undefined && ${c}.${v} !== null`;
                c += '.' + v;
            });
            build += ')';
            return build;
        }

        // Read the variable
        function buildDot(ctx: string) {
            return '(' + checkDot(ctx) + '?' + ctx + match.join('.') + ' : "")';
        }
        result = '(' + checkDot('_ctx.') + ' ? ' + buildDot('_ctx.') + ' : ' + buildDot('') + ')';

        // If variable = null, will return ''
        return '(' + result + ' !== null ? ' + result + ' : ' + '"" )';
    }
}

const parse = function (swig: Swig, source: string, opts: SwigOptions, tags: Tags, filters: Filters): ParsedToken {
    source = source.replace(/\r\n/g, '\n');
    let escape = opts.autoescape,
        [tagOpen, tagClose] = opts.tagControls,
        [varOpen, varClose] = opts.varControls,
        [cmtOpen, cmtClose] = opts.cmtControls,
        escapedTagOpen = escapeRegExp(tagOpen),
        escapedTagClose = escapeRegExp(tagClose),
        escapedVarOpen = escapeRegExp(varOpen),
        escapedVarClose = escapeRegExp(varClose),
        escapeCmtOpen = escapeRegExp(cmtOpen),
        escapeCmtClose = escapeRegExp(cmtClose),
        tagStrip = new RegExp('^' + escapedTagOpen + '-?\\s*|\\s*-?' + escapedTagClose + '$', 'g'),
        tagStripBefore = new RegExp('^' + escapedTagOpen + '-'),
        tagStripAfter = new RegExp('-' + escapedTagClose + '$'),
        varStrip = new RegExp('^' + escapedVarOpen + '-?\\s*|\\s*-?' + escapedVarClose + '$', 'g'),
        varStripBefore = new RegExp('^' + escapedVarOpen + '-'),
        varStripAfter = new RegExp('-' + escapedVarClose + '$'),

        anyChar = '[\\s\\S]*?',
        splitter = new RegExp(
            '(' +
            escapedTagOpen + anyChar + escapedTagClose + '|' +
            escapedVarOpen + anyChar + escapedVarClose + '|' +
            escapeCmtOpen + anyChar + escapeCmtClose +
            ')'
        ),
        line = 1,
        stack: Token[] = [],
        parent: string = null,
        tokens = [],
        blocks = {},
        inRaw = false,
        stripNext;

    /**
     * Parse a variable.
     * 
     * @param str  String contents of the variable, between <i>{{</i> and <i>}}</i>
     * @param line The line number that this variable starts on.
     * @return {VarToken}   Parsed variable token object.
     */
    function parseVariable(str: string, line: number): { compile: () => string } {
        const tokens = lexer.read(str);
        const parser = new TokenParser(tokens, filters, escape, line, opts.filename);
        const out = parser.parse().join('');

        if (parser.state.length) {
            utils.throwError(`Unable to parse "${str}"`, line, opts.filename);
        }

        return {
            compile: function () {
                return '_output +=' + out + ';\n';
            }
        };
    }

    /**
     * Parse a tag.
     * 
     * @param str  String contents of the variable, between <i>{%</i> and <i>%}</i>
     * @param line The line number that this variable starts on.
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

        if (!tag.parse(chunks[1], line, parser, stack, opts, swig)) {
            utils.throwError('Unexpected tag "' + tagName + '"', line, opts.filename);
        }

        args = parser.parse();

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

    /**
     * Strip the whitespace from the previous tokes, if it is a string.
     * 
     * @param token     Parsed token.
     * @returns {object}    If token was a string, trailing whitespace will be stripped.
     */
    function stripPrevToken(token: any) {
        if (typeof token === 'string') {
            token = token.replace(/\s*$/, '');
        }

        return token;
    }

    /*!
     * Loop over the source, split via the tag/var/comment regular expression splitter.
     * Send each chunl to the appropriate parser.
     */
    source.split(splitter).forEach((chunk) => {
        let token, lines, stripPrev, prevToken, prevChildToken;

        if (!chunk) {
            return;
        }

        if (!inRaw && chunk.startsWith(varOpen) && chunk.endsWith(varClose)) {
            // Is a variable.
            stripPrev = varStripBefore.test(chunk);
            stripNext = varStripBefore.test(chunk);
            token = parseVariable(chunk.replace(varStrip, ''), line);
        } else if (chunk.startsWith(tagOpen) && chunk.endsWith(tagClose)) {
            // Is a tag
            stripPrev = tagStripAfter.test(chunk);
            stripNext = tagStripBefore.test(chunk);
            token = parseTag(chunk.replace(tagStrip, ''), line);
            if (token) {
                if (token.name === 'extends') {
                    parent = token.args.join('').replace(/^\'|\'$/g, '').replace(/^\"|\"$/g, '');
                } else if (token.block && !stack.length) {
                    blocks[token.args.join('')] = token;
                }
            }
            if (inRaw && !token) {
                token = chunk;
            }
        } else if (inRaw || (!utils.startWith(chunk, cmtOpen) && !utils.endsWith(chunk, cmtClose))) {
            // Is content string
            token = (stripNext) ? chunk.replace(/^\s*/, '') : chunk;
            stripNext = false;
        } else if (utils.startWith(chunk, cmtOpen) && utils.endsWith(chunk, cmtClose)) {
            return;
        }

        // Did this tag ask to strip previous whitespace? {%- ... %} or {{- ... }}
        if (stripPrev && tokens.length) {
            prevToken = tokens.pop();
            if (typeof prevToken === 'string') {
                prevToken = stripPrevToken(prevToken);
            } else if (prevToken.content && prevToken.content.length) {
                prevChildToken = stripPrevToken(prevToken.content.pop());
                prevToken.content.push(prevChildToken);
            }
            tokens.push(prevToken);
        }

        if (!token) {
            return;
        }

        // If there's an open item in the stack, add this to its content.
        if (stack.length) {
            stack[stack.length - 1].content.push(token);
        } else {
            tokens.push(token);
        }

        // If the token is a tag that requires an end tag, open it on the stack.
        if (token.name && token.ends) {
            stack.push(token);
        }

        lines = chunk.match(/\n/g);
        line += (lines) ? lines.length : 0;
    });

    return {
        name: opts.filename,
        parent: parent,
        tokens: tokens,
        blocks: blocks
    }
}

/**
 * Compile an array of tokens.
 * @param  template     An array of template tokens.
 * @param  parents  Array of parent templates.
 * @param  [options]   Swig options object.
 * @param  [blockName]   Name of the current block context.
 * @return {string}               Partial for a compiled JavaScript method that will output a rendered template.
 */
const compile = function (template, parents, options: SwigOptions, blockName?: string) {
    let out = '',
        tokens = utils.isArray(template) ? template : template.tokens;

    utils.each(tokens, function (token) {
        let o;
        // 纯文字在这里填充进去
        if (typeof token === 'string') {
            out += '_output += "' + token.replace(/\\/g, '\\\\').replace(/\n|\r/g, '\\n').replace(/"/g, '\\"') + '";\n';
            return;
        }

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
         * @param compiler
         * @param [args] Array of parsed arguments on the for the token.
         * @param [content] Array of content within the token.
         * @param [parents] Array of parent templates for the current template context.
         * @param [options] Swig Options Object
         * @param [blockName] Name of the direct block parent, if any.
         */
        o = token.compile(compile, token.args ? token.args.slice(0) : [], token.content ? token.content.slice(0) : [], parents, options, blockName);
        out += o || '';
    });

    return out;
}

export default {
    parse: parse,
    compile: compile
}
