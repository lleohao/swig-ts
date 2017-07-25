import * as should from 'should';

function checkDot(ctx: string, match) {
    let temp = match[0],
        c = ctx + temp,
        build = '';

    build = `(typeof ${c} !== "undefined" && ${c} !== null`;
    match.forEach((v, i) => {
        if (i === 0) {
            return;
        }
        build += ` && ${c}.${v} !== undefined && ${c}.${v} !== null`;
        c += '.' + v;
    });
    build += ')';
    return build;
}

function buildDot(ctx: string, match) {
    return '(' + checkDot(ctx, match) + ' ? ' + ctx + match.join('.') + ' : "")';
}

function preCheckMatch(ctx: string, match: string[]) {
    return '(' + checkDot(ctx, match) + ' ? ' + buildDot(ctx, match) + ' : ' + buildDot('', match) + ')';
}

const checkMatch = (match: string[]): string => {
    let temp = match[0], result;

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

    function buildDot(ctx: string) {
        return '(' + checkDot(ctx) + '?' + ctx + match.join('.') + ' : "")';
    }

    result = '(' + checkDot('_ctx.') + ' ? ' + buildDot('_ctx.') + ' : ' + buildDot('') + ')';

    return '(' + result + ' !== null ? ' + result + ' : ' + '"" )';
}

const _ctx = {
    name: 'lleo',
    a: {
        b: 22
    }
};
const age = 22;
const _null = null;

describe('checkDot test', () => {
    it('can check string whitout the dot', () => {
        const result = checkDot('_ctx.', ['name']);
        should(result).be.eql('(typeof _ctx.name !== "undefined" && _ctx.name !== null)');
        should(eval(result)).be.ok();
    });

    it('can check string with the dot', () => {
        const result = checkDot('_ctx.', ['a', 'b']);
        should(result).be.eql('(typeof _ctx.a !== "undefined" && _ctx.a !== null && _ctx.a.b !== undefined && _ctx.a.b !== null)');
        should(eval(result)).be.ok();
    });
});

describe('buildDot test', () => {
    it('can check string whitout the dot', () => {
        const result = buildDot('_ctx.', ['name']);
        should(result).be.eql('((typeof _ctx.name !== "undefined" && _ctx.name !== null) ? _ctx.name : "")');
        should(eval(result)).be.ok();
    });

    it('can check string with the dot', () => {
        const result = buildDot('_ctx.', ['a', 'b']);
        should(result).be.eql('((typeof _ctx.a !== "undefined" && _ctx.a !== null && _ctx.a.b !== undefined && _ctx.a.b !== null) ? _ctx.a.b : "")');
        should(eval(result)).be.eql(22);
    });

    it('can check undefined value', () => {
        const result = buildDot('_ctx.', ['a', 'c']);
        should(result).be.eql('((typeof _ctx.a !== "undefined" && _ctx.a !== null && _ctx.a.c !== undefined && _ctx.a.c !== null) ? _ctx.a.c : "")');
        should(eval(result)).be.eql('');
    });

    it('can check undefined value', () => {
        const result = buildDot('_ctx.', ['age']);
        should(result).be.eql('((typeof _ctx.age !== "undefined" && _ctx.age !== null) ? _ctx.age : "")');
        should(eval(result)).be.eql('');
    });
})

describe('checkMatch test', () => {
    it('read global value', () => {
        should(eval(checkMatch(['age']))).be.eql(22);
    });

    it('read global value, will set null to ""', () => {
        should(eval(checkMatch(['_null']))).be.eql('');
    });

    it('read global undefined value', () => {
        should(eval(checkMatch(['age2']))).be.eql('');
    });

    it('read local value', () => {
        should(eval(checkMatch(['a', 'b']))).be.eql(22);
    });

    it('read undefined value', () => {
        should(eval(checkMatch(['c']))).be.eql('');
    });
})