import { Swig } from '../lib/swig';
import _ = require('lodash');
import should = require('should');

const cases = {
    addslashes: [
        {
            v: "\"Top O' the\\ mornin\"",
            e: "\\&quot;Top O\\&#39; the\\\\ mornin\\&quot;"
        },
        {
            c: 'v|addslashes|raw',
            v: ["\"Top", "O'", "the\\", "mornin\""],
            e: '\\"Top,O\\\',the\\\\,mornin\\"'
        }
    ],
    capitalize: [
        { v: 'awesome sAuce.', e: 'Awesome sauce.' },
        { v: 345, e: '345' },
        { v: ['foo', 'bar'], e: 'Foo,Bar' }
    ],
    'default': [
        { c: 'v|default("tacos")', v: 'foo', e: 'foo' },
        { c: 'v|default("tacos")', v: 0, e: '0' },
        { c: 'v|default("tacos")', v: '', e: 'tacos' },
        { c: 'v|default("tacos")', v: undefined, e: 'tacos' },
        { c: 'v|default("tacos")', v: null, e: 'tacos' },
        { c: 'v|default("tacos")', v: false, e: 'tacos' }
    ],
    'escape': [
        { c: 'v|escape', v: '<foo>', e: '&lt;foo&gt;' },
        { c: 'v|e("js")', v: '"double quotes" and \'single quotes\'', e: '\\u0022double quotes\\u0022 and \\u0027single quotes\\u0027' },
        { c: 'v|escape("js")', v: '<script>and this</script>', e: '\\u003Cscript\\u003Eand this\\u003C/script\\u003E' },
        { c: 'v|e("js")', v: '\\ : backslashes, too', e: '\\u005C : backslashes, too' },
        { c: 'v|e("js")', v: 'and lots of whitespace: \r\n\t\v\f\b', e: 'and lots of whitespace: \\u000D\\u000A\\u0009\\u000B\\u000C\\u0008' },
        { c: 'v|e("js")', v: 'and "special" chars = -1;', e: 'and \\u0022special\\u0022 chars \\u003D \\u002D1\\u003B' },
        { c: 'v|e', v: ['<p>', '</p>'], e: '&lt;p&gt;,&lt;/p&gt;' }
    ],
    first: [
        { v: [1, 2, 3, 4], e: '1' },
        { v: '213', e: '2' },
        { v: { foo: 'blah' }, e: 'blah' }
    ],
    groupBy: [
        { c: 'v|groupBy("name")|json', v: [{ name: 'a', a: 1 }, { name: 'a', a: 2 }, { name: 'b', a: 3 }], e: JSON.stringify({ a: [{ a: 1 }, { a: 2 }], b: [{ a: 3 }] }).replace(/"/g, '&quot;') },
        { c: 'v|groupBy("name")', v: 'foo', e: 'foo' }
    ],
    join: [
        { c: 'v|join("+")', v: [1, 2, 3], e: '1+2+3' },
        { c: 'v|join(" * ")', v: [1, 2, 3], e: '1 * 2 * 3' },
        { c: 'v|join(",")', v: [1, 2, 3], e: '1,2,3' },
        { c: 'v|join(", ")', v: { f: 1, b: 2, z: 3 }, e: '1, 2, 3' },
        { c: 'v|join("-")', v: 'asdf', e: 'asdf' }
    ],
    json: [
        { v: { foo: 'bar', baz: [1, 2, 3] }, e: '{&quot;foo&quot;:&quot;bar&quot;,&quot;baz&quot;:[1,2,3]}' },
        { c: 'v|json(2)', v: { foo: 'bar', baz: [1, 2, 3] }, e: '{\n  &quot;foo&quot;: &quot;bar&quot;,\n  &quot;baz&quot;: [\n    1,\n    2,\n    3\n  ]\n}' }
    ],
    last: [
        { v: [1, 2, 3, 4], e: '4' },
        { v: '123', e: '3' },
        { v: { foo: 'blah', bar: 'nope' }, e: 'nope' }
    ],
    length: [
        { v: [1, 2, 3, 4], e: '4' },
        { v: '123', e: '3' },
        { v: { foo: 'blah', bar: 'nope' }, e: '2' },
        { v: 5, e: '' }
    ],
    lower: [
        { v: 'BaR', e: 'bar' },
        { v: '345', e: '345' },
        { v: ['FOO', 'bAr'], e: 'foo,bar' },
        { c: 'v|lower|join("")', v: { foo: 'BAR' }, e: 'bar' }
    ],
    safe: [
        { c: 'v|safe', v: '<&>', e: '<&>' },
        { c: 'v|raw', v: '<&>', e: '<&>' },
        { c: 'v|first|safe', v: ['<&>'], e: '<&>' },
        { c: 'v|safe|lower', v: '<&>fOo', e: '<&>foo' }
    ],
    replace: [
        { c: 'v|replace("o", "a")', v: 'foo', e: 'fao' },
        { c: 'v|replace("o", "", "g")', v: 'fooboo', e: 'fb' },
        { c: 'v|replace("\\W+", "-")', v: '$*&1aZ', e: '-1aZ' }
    ],
    reverse: [
        { v: [1, 2, 3], e: '3,2,1' },
        { v: 'asdf', e: 'fdsa' },
        { v: { baz: 'bop', foo: 'bar' }, e: 'foo,baz' }
    ],
    sort: [
        { v: [3, 1, 4], e: '1,3,4' },
        { v: 'zaq', e: 'aqz' },
        { v: { foo: '1', bar: '2' }, e: 'bar,foo' }
    ],
    striptags: [
        { v: '<h1>foo</h1> <div class="blah">hi</div>', e: 'foo hi' },
        { v: ['<foo>bar</foo>', '<bar>foo'], e: 'bar,foo' }
    ],
    title: [
        { v: 'this iS titLe case', e: 'This Is Title Case' },
        { v: ['foo', 'bAr'], e: 'Foo,Bar' }
    ],
    uniq: [
        { v: [2, 1, 2, 3, 4, 4], e: '2,1,3,4' },
        { v: 'foo', e: '' }
    ],
    upper: [
        { v: 'bar', e: 'BAR' },
        { v: 345, e: '345' },
        { v: ['foo', 'bAr'], e: 'FOO,BAR' },
        { c: 'v|upper|join("")', v: { foo: 'bar' }, e: 'BAR' }
    ],
    url_encode: [
        { v: 'param=1&anotherParam=2', e: 'param%3D1%26anotherParam%3D2' },
        { v: ['param=1', 'anotherParam=2'], e: 'param%3D1,anotherParam%3D2' }
    ],
    url_decode: [
        { v: 'param%3D1%26anotherParam%3D2', e: 'param=1&amp;anotherParam=2' },
        { v: ['param%3D1', 'anotherParam%3D2'], e: 'param=1,anotherParam=2' }
    ]
};

describe('Filters:', function () {
    let swig: Swig;

    beforeEach(() => {
        swig = new Swig;
    });
    afterEach(() => {
        swig = null;
    });

    describe('can be set', function () {
        it('and used in templates', function () {
            swig.setFilter('foo', function () { return 3; });
            should(swig.render('{{ b|foo() }}')).be.eql('3');
        });
    });

    it('can accept params', function () {
        swig.setFilter('foo', function (inp, arg) { return arg; });
        should(swig.render('{{ b|foo(3) }}')).be.eql('3');
    });

    it('can be very complexly nested', function () {
        should(swig.render('{{ b|default(c|default("3")) }}')).be.eql('3');
    });

    it('throws on unknown filter', function () {
        should.throws(function () {
            swig.render('{{ foo|thisisnotreal }}', { filename: 'foobar.html' });
        }, /Invalid filter "thisisnotreal" on line 1 in file foobar\.html\./);
    });

    _.each(cases, function (cases, filter) {
        describe(filter, function () {
            _.each(cases, function (c) {
                var code = '{{ ' + (c.c || 'v|' + filter) + ' }}',
                    clone = _.cloneDeep(c.v);
                it(code + ', v=' + JSON.stringify(c.v) + ' should render ' + c.e.replace(/\n/g, '\\n'), function () {
                    if ((/\|date\(/).test(code)) {
                        code = '{{ ' + c.c.replace(/\"\)$/, '", 420)') + ' }}';
                    }
                    should(swig.render(code, { locals: { v: c.v } }))
                        .be.eql(c.e);
                });
                it(code + ', v=' + JSON.stringify(clone) + ' should should not mutate value', function () {
                    should(c.v).be.eql(clone);
                });
            });
        });
    });

    it('gh-337: does not overwrite original data', function () {
        var obj = { a: '<hi>' };
        swig.render('{{ a }}', { locals: { a: obj } });
        should(obj.a).be.eql('<hi>');
    });

    it('gh-365: filters applied be fqtions after dotkey', function () {
        var locals = {
            w: {
                g: function () { return 'foo'; },
                r: function () { return [1, 2, 3]; }
            },
            b: function () { return 'bar'; }
        };
        should(swig.render('{{ w.g("a")|replace("f", w.r().length) }}', { locals: locals })).be.eql('3oo');
        should(swig.render('{{ "foo"|replace(w.g("a"), "bar") }}', { locals: locals })).be.eql('bar');
        should(swig.render('{{ "3"|replace(w.g("a").length, "bar") }}', { locals: locals })).be.eql('bar');
        should(swig.render('{{ "bar"|replace(b("a"), "foo") }}', { locals: locals })).be.eql('foo');
    });

    it('gh-397: Filter index applied to functions with arguments is one-off', function () {
        var locals = {
            r: function () { return [1, 2, 3]; },
            u: 'Tacos',
            t: 'L N'
        };

        should(swig.render("{{ t|replace('L', r('items').length)|replace('N', u) }}", { locals: locals })).be.eql('3 Tacos');
    });

    it("gh-441: Chaining filters on top of functions within tags", function () {
        var locals = {
            getFoo: function () {
                return [1, 3, 0];
            }
        };

        should(swig.render('{{ foo|default("bar")|reverse }}')).be.eql('rab');
        should(swig.render("{{ getFoo('foo')|join('*')|reverse }}", { locals: locals })).be.eql('0*3*1');
        should(swig.render("{% set foo = getFoo('foo')|join('+')|reverse %}{{ foo }}", { locals: locals })).be.eql('0+3+1');
        should(swig.render("{% for a in getFoo('foo')|sort(true)|reverse %}{{ a }}%{% endfor %}", { locals: locals })).be.eql('3%1%0%');
        should(swig.render('{% if "0+3+1" === getFoo("f")|join("+")|reverse %}yep{% endif %}', { locals: locals })).be.eql('yep');
        should(swig.render('{% if "0+3+1" === getFoo("f")|join("+")|reverse && null|default(true) %}yep{% endif %}', { locals: locals })).be.eql('yep');
    });

});
