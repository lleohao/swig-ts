import { LexerToken } from '../lexer';
// Magic tag, hardcoded into parser

const compile = function (compiler, args, content, parents, options, blockName) {
    return compiler(content, parents, options, blockName);
}

const parse = function (str: string, line: number, parser) {
    parser.on('*', function (token: LexerToken) {
        throw new Error(`Unexpected token "${token.match}" in raw tag on line ${line}`);
    })
    return true;
}

const ends = true;

export default {
    compile: compile,
    parse: parse,
    ends: ends
}