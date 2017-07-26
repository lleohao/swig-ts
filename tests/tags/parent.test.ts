import { Swig } from '../../lib/swig';
import should = require('should');

const swig = new Swig();

describe('Tag: parent', function () {
    it('does nothing if no parent', function () {
        should(swig.render('{% parent %}')).be.eql('');
    });

    it('does not accept arguments', function () {
        should.throws(function () {
            swig.render('{% parent foobar %}');
        }, /Unexpected argument "foobar" on line 1\./);
    });
});
