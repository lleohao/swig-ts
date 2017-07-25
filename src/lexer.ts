import utils from './utils';

export interface LexerToken {
    match: string;
    type: number;
    length?: number;
}

/**
 * A lexer token.
 * @typedef {object} LexerToken
 * @property {string} match     The string that was matched.
 * @property {number} type      Lexer type enum.
 * @property {number} length    Length of the original string processed.
 */
export enum TYPES {
    /** Whitesapce */
    WHITESPACE = 0,
    /** Plain string 纯文字 */
    STRING = 1,
    /** Variable filter */
    FILTER = 2,
    /** Empty variable filter */
    FILTEREMPTY = 3,
    /** Function */
    FUNCTION = 4,
    /** Function with no arguments */
    FUNCTIONEMPTY = 5,
    /** Open parentesis 括号开始 */
    PARENOPEN = 6,
    /** Close parentesis 括号结束 */
    PARENCLOSE = 7,
    /** Comma 逗号 */
    COMMA = 8,
    /** Variable 变量 */
    VAR = 9,
    /** Number */
    NUMBER = 10,
    /** Math operator */
    OPERATOR = 11,
    /** Open square bracket 方括号开始 */
    BRACKETOPEN = 12,
    /** Close square bracket 方括号结束 */
    BRACKETCLOSE = 13,
    /** Key on an object using dot-notation */
    DOTKEY = 14,
    /** Start of an array */
    ARRAYOPEN = 15,
    /** End of an array
     * Currently unused
    ARRAYCLOSE= 16, */
    /** Open curly brace 花括号开始 */
    CURLYOPEN = 17,
    /** Close curly brace 花括号结束 */
    CURLYCLOSE = 18,
    /** Colon (=) 冒号 */
    COLON = 19,
    /** Javascript-valid comparator 比较器 */
    COMPARATOR = 20,
    /** Boolean logic 布尔运算符 */
    LOGIC = 21,
    /** Boolean logic "not" */
    NOT = 22,
    /** true or false */
    BOOL = 23,
    /** Varsiable assignment */
    ASSIGNMENT = 24,
    /** Start of a method */
    METHODOPEN = 25,
    /** End of a method
     * Currently unused
    METHODEND= 26, */
    /** Unknown type */
    UNKNOWN = 100
};

const rules = [
    {
        type: TYPES.WHITESPACE,
        regex: [
            /^\s+/
        ]
    },
    {
        type: TYPES.STRING,
        regex: [
            /^""/,
            /^".*?[^\\]"/,
            /^''/,
            /^'.*?[^\\]'/
        ]
    },
    {
        type: TYPES.FILTER,
        regex: [
            /^\|\s*(\w+)\(/
        ],
        idx: 1
    },
    {
        type: TYPES.FILTEREMPTY,
        regex: [
            /^\|\s*(\w+)/
        ],
        idx: 1
    },
    {
        type: TYPES.FUNCTIONEMPTY,
        regex: [
            /^\s*(\w+)\(\)/
        ],
        idx: 1
    },
    {
        type: TYPES.FUNCTION,
        regex: [
            /^\s*(\w+)\(/
        ],
        idx: 1
    },
    {
        type: TYPES.PARENOPEN,
        regex: [
            /^\(/
        ]
    },
    {
        type: TYPES.PARENCLOSE,
        regex: [
            /^\)/
        ]
    },
    {
        type: TYPES.COMMA,
        regex: [
            /^,/
        ]
    },
    {
        type: TYPES.LOGIC,
        regex: [
            /^(&&|\|\|)\s*/,
            /^(and|or)\s+/
        ],
        idx: 1,
        replace: {
            'and': '&&',
            'or': '||'
        }
    },
    {
        type: TYPES.COMPARATOR,
        regex: [
            /^(===|==|\!==|\!=|<=|<|>=|>|in\s|gte\s|gt\s|lte\s|lt\s)\s*/
        ],
        idx: 1,
        replace: {
            'gte': '>=',
            'gt': '>',
            'lte': '<=',
            'lt': '<'
        }
    },
    {
        type: TYPES.ASSIGNMENT,
        regex: [
            /^(=|\+=|-=|\*=|\/=)/
        ]
    },
    {
        type: TYPES.NOT,
        regex: [
            /^\!\s*/,
            /^not\s+/
        ],
        replace: {
            'not': '!'
        }
    },
    {
        type: TYPES.BOOL,
        regex: [
            /^(true|false)\s+/,
            /^(true|false)$/
        ],
        idx: 1
    },
    {
        type: TYPES.VAR,
        regex: [
            /^[a-zA-Z_$]\w*((\.\$?\w*)+)?/,
            /^[a-zA-Z_$]\w*/
        ]
    },
    {
        type: TYPES.BRACKETOPEN,
        regex: [
            /^\[/
        ]
    },
    {
        type: TYPES.BRACKETCLOSE,
        regex: [
            /^\]/
        ]
    },
    {
        type: TYPES.CURLYOPEN,
        regex: [
            /^\{/
        ]
    },
    {
        type: TYPES.COLON,
        regex: [
            /^\:/
        ]
    },
    {
        type: TYPES.CURLYCLOSE,
        regex: [
            /^\}/
        ]
    },
    {
        type: TYPES.DOTKEY,
        regex: [
            /^\.(\w+)/
        ],
        idx: 1
    },
    {
        type: TYPES.NUMBER,
        regex: [
            /^[+\-]?\d+(\.\d+)?/
        ]
    },
    {
        type: TYPES.OPERATOR,
        regex: [
            /^(\+|\-|\/|\*|%)/
        ]
    }
];

/**
 * Return tohe token object for a single chunk of a string.
 * 
 * @param {string} str      str String chunk.
 * @return {LexerToken}     Defined type, potentially stripped or replaced with more suitable content.
 * @private
 */
function reader(str: string): LexerToken {
    let matched;

    rules.some((rule) => {
        return rule.regex.some((regex) => {
            const match = str.match(regex);
            let normalized;

            if (!match) {
                return;
            }

            normalized = match[rule['idx'] || 0].replace(/\s*$/, '');
            normalized = ((rule as Object).hasOwnProperty('replace') && rule['replace'].hasOwnProperty(normalized)) ? rule['replace'][normalized] : normalized;

            matched = {
                match: normalized,
                type: rule.type,
                length: match[0].length
            };

            return true;
        })
    })

    if (!matched) {
        matched = {
            match: str,
            type: TYPES.UNKNOWN,
            length: str.length
        }
    };

    return matched;
}

/**
 * Read a string and break it into separate token types.
 * 
 * @param {string} str  
 * @return {LexerToken[]}   Array of defined types, potentially stripped or replaced with more suitable content.
 * @private
 */
const read = (str: string): LexerToken[] => {
    let offset = 0,
        tokens = [],
        substr,
        match;

    while (offset < str.length) {
        substr = str.substring(offset);
        match = reader(substr);
        offset += match.length;
        tokens.push(match);
    }

    return tokens;
}

export default {
    read
}
