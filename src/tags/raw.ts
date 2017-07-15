// Magic tag, hardcoded into parser

const compile = function (compiler, args, content, parents, options, blockName) {
    return compiler(content, parents, options, blockName);
}

const parse = function (str, line, parser) {
    parser.on('*', function (token) {
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