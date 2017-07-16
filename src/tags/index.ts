import raw from './raw';
import _if from './if';
import elseif from './esleif';
import _else from './else';
import block from './block';

export interface TagToken {
    compile: Function;
    parse: Function;
    ends?: boolean;
    block?: boolean;
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
    block: block
}