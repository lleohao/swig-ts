import * as should from 'should';
import swig, { Swig } from '../lib/swig';
import { statSync, readFileSync } from 'fs';

describe('Options', () => {
    let swig: Swig;
    beforeEach(() => {
        swig = new Swig();
    })
    afterEach(() => {
        swig = null;
    })

    it('valiation options test', () => {
        should.throws(() => {
            new Swig({
                varControls: ['<<', '<<']
            })
        })
        should.throws(() => {
            new Swig({
                varControls: ['<', '>']
            })
        })
    })

    describe('open/close controls', () => {
        it('can have new line inside', () => {
            should(swig.render('{{\nfoo\n}}', { locals: { foo: 'tacos' } })).be.eql('tacos');
            should(swig.render('{%\nif foo\n%}tacos{% endif %}', { locals: { foo: 'tacos' } }))
                .be.eql('tacos');
            should(swig.render('{#\nfoo\n#}'))
                .be.eql('');
        })

        it('can be set at compile time', () => {
            should(swig.compile('<%= a %>', { varControls: ['<%=', '%>'] })({ a: 'b' })).be.eql('b');
            should(swig.compile('<* if a *>c<* endif *>', { tagControls: ['<*', '*>'] })({ a: 1 })).be.eql('c');
            should(swig.compile('<!-- hello -->', { cmtControls: ['<!--', '-->'] })({})).be.eql('');
        });

        it('can be set as default', () => {
            let swig = new Swig({
                varControls: ['<=', '=>'],
                tagControls: ['<%', '%>'],
                cmtControls: ['<#', '#>']
            })
            should(swig.compile('<= a =>')({ a: 'b' })).be.eql('b');
            should(swig.compile('<% if a %>b<% endif %>')({ a: 1 })).be.eql('b');
            should(swig.compile('<# hello #>')({})).be.eql('');
        });

        it('must be different', function () {
            ['varControls', 'tagControls', 'cmtControls'].forEach((key) => {
                let o = {};
                o[key] = ['**', '**'];
                should.throws(() => {
                    swig.compile('', o);
                }, 'Option "' + key + '" open and close controls must not be the same.')
            })
        });

        it('must be at least 2 characters', function () {
            ['varControls', 'tagControls', 'cmtControls'].forEach((key) => {
                let o = {};
                o[key] = ['&', '**'];
                should.throws(() => {
                    swig.compile('', o);
                }, 'Option "' + key + '" close control must be at least 2 characters. Saw "&" instead.')
                o[key] = ['**', "!"];
                should.throws(() => {
                    swig.compile('', o);
                }, 'Option "' + key + '" close control must be at least 2 characters. Saw "!" instead.')
            })
        });
    });

    describe('locals', () => {
        it('can be set as defaults', () => {
            let swig = new Swig({ locals: { a: 1, b: 2 } });
            const tpl = '{{ a }}{{ b }}{{ c }}';
            should(swig.compile(tpl)({ c: 3 })).be.eql('123');
            should(swig.compile(tpl, { locals: { c: 3 } })()).be.eql('123');
            should(swig.render(tpl, { locals: { c: 3 } })).be.eql('123');
        })

        it('use local-context first for output', function () {
            const tpl = '{{ foo }}';
            should(swig.render(tpl, { locals: { foo: 'bar' } })).be.eql('bar');
            global['foo'] = 'foo';
            should(swig.render(tpl, { locals: {} })).be.eql('foo');
            delete global['foo'];
            should(swig.render(tpl, { locals: {} })).be.eql('');
        });
    });

    describe('null object', () => {
        it('can skip null object', function () {
            should(swig.render('{{ a.property }}', { locals: { a: null } })).be.eql('');
        });
    });
})

describe('Separate instances', () => {
    it('properly autoescapes', () => {
        const a = new Swig({ autoescape: false }),
            b = new Swig();
        should(a.render('{{ foo }}', { locals: { foo: '<h1>' } })).be.equal('<h1>');
        should(b.render('{{ foo }}', { locals: { foo: '<h1>' } })).be.equal('&lt;h1&gt;');
    });
});

describe('swog.compileFile', () => {
    const test = __dirname + '/cases/extends_1.test.html';

    let swig: Swig;
    beforeEach(() => {
        swig = new Swig();
    });
    afterEach(() => {
        swig = null;
    });

    it('can run syncronously', () => {
        should(swig.compileFile(test)()).be.ok();
    });

    it('can run asynchronously', (done) => {
        // Run twice to ensure cached result uses the callback [gh-291]
        swig.compileFile(test, {}, (err, fn) => {
            should(fn).is.a.Function();
            should(swig.compileFile(test, {}, (err, fn) => {
                should(fn).is.a.Function();
                done();
            }));
        });
    });

    it('can use callback with errors', function (done) {
        let errorTest = __dirname + '/cases-error/extends-non-existent.test.html';
        swig.compileFile(errorTest, {}, function (err) {
            should(err.code).be.eql('ENOENT');
            done();
        });
    });
});


describe('swig.renderFile', () => {
    let test, expectation, s;

    it('can use callback with errors occurred at the time of rendering', function (done) {
        const s = new Swig({ loader: swig.loaders.memory({ 'error.html': '{{ foo() }}' }) });

        s.renderFile('error.html', { foo: function () { throw new Error('bunk'); } }, function (err, out) {
            should(err.message).be.eql('bunk');
            done();
        });
    });

    test = __dirname + '/cases/extends_1.test.html';
    expectation = readFileSync(test.replace('test.html', 'expectation.html'), 'utf8');

    beforeEach(() => {
        s = new Swig();
    });
    afterEach(() => {
        s = null;
    });

    it('can run syncronously', function () {
        should(s.renderFile(test))
            .be.eql(expectation);
    });

    it('can run asynchronously', function (done) {
        s.renderFile(test, {}, function (err, fn) {
            should(fn).be.eql(expectation);
            done();
        });
    });

    it('can use callbacks with errors', function (done) {
        s.renderFile(__dirname + '/cases/not-existing', {}, function (err, out) {
            should(err.code).be.eql('ENOENT');
            done();
        });
    });
})
