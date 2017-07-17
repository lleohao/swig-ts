import { CompileFunction, ParseFunction } from './index';
import ifparser from './if';

const compile: CompileFunction = function (compiler, args) {
    return `} else if ( ${args.join(' ')} ) {\n`;
};

const parse: ParseFunction = function (str, line, parser, types, stack) {
    let okay = ifparser.parse(str, line, parser, types);
    return okay && (stack.length && stack[stack.length - 1].name === 'if');
}

export default {
    compile: compile,
    parse: parse
}