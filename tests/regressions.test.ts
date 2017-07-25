import { Swig } from '../lib/swig';
import * as fs from 'fs';
import * as should from 'should';

const swig = new Swig();

describe('Regressions', function () {
    it('gh-285: preserves forward-slashes in text', function () {
        should(swig.render('foo\\ blah \\ and stuff'))
            .be.eql('foo\\ blah \\ and stuff');
    });

    // it('gh-303: sets work in loops', function () {
    //     var opts = { locals: { b: [1] } };
    //     should(swig.render('{% set foo = "old" %}{% for a in b %}{% if a %}{% set foo = "new" %}{% endif %}{% endfor %}{{ foo }}', opts))
    //         .be.eql('new');
    // });

    it('gh-322: logic words are not partially matched', function () {
        should(swig.render('{{ org }}', { locals: { org: 'foo' } })).be.eql('foo');
        should(swig.render('{{ andif }}', { locals: { andif: 'foo' } })).be.eql('foo');
        should(swig.render('{{ note }}', { locals: { note: 'foo' } })).be.eql('foo');
        should(swig.render('{{ truestuff }}', { locals: { truestuff: 'foo' } })).be.eql('foo');
        should(swig.render('{{ falsey }}', { locals: { falsey: 'foo' } })).be.eql('foo');
    });

    it('gh-323: stuff', function () {
        var tpl = "{% set foo = {label:'account.label',value:page.code} %}",
            opts = { locals: { page: { code: 'tacos' } } };
        should(swig.render(tpl + '{{ foo.value }}', opts)).be.eql('tacos');
    });

    // The following tests should *not* run in the browser
    if (!fs || !fs.readFileSync) {
        return;
    }

    it('gh-287: Options object overwrite exposure', function () {
        var opts = {};
        swig.compileFile(__dirname + '/cases/extends_1.test.html', opts);
        should(Object.keys(opts)).be.eql([]);
    });
});
