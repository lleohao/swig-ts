import raw from './raw';

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
    raw: raw
}