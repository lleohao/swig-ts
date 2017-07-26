import swig, { Swig } from '../../lib/swig';
import should = require('should');

const s = new Swig();

describe('Tag: include', function () {
    it('Works with non-relative loader setups', function () {
        const s = new Swig({ loader: swig.loaders.memory({ '/foo/foobar': 'tacos!' }, '/foo') });
        should(s.render('{% include "foobar" %}')).be.eql('tacos!');
    });

    describe('{% include "foo" ignore missing %}', function () {
        it('does not throw if missing', function () {
            should(s.render('{% include "foo" ignore missing %}', { filename: '/foo' }))
                .be.eql('');
        });

        it('throws on bad syntax', function () {
            should.throws(function () {
                s.render('{% include "foo" missing %}', { filename: '/bar' });
            }, /Unexpected token "missing" on line 1\./);

            should.throws(function () {
                s.render('{% include "foo" ignore foobar %}', { filename: '/baz' });
            }, /Expected "missing" on line 1 but found "foobar"\./);
        });
    });
});
