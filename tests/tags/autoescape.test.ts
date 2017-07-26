import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');


describe('Tag: autoescape', function () {
    let swig: Swig;

    beforeEach(() => {
        swig = new Swig();
    });
    afterEach(() => {
        swig = null;
    });

    it('{% autoescape true %} turns escaping on', function () {
        let swig = new Swig({ autoescape: false });
        should(swig.render('{% autoescape true %}{{ "<foo>" }}{% endautoescape %}{{ "<bar>" }}'))
            .be.eql('&lt;foo&gt;<bar>');
    });

    it('{% autoescape "js" %} escapes for js', function () {
        should(swig.render('{% autoescape "js" %}{{ \'"special" chars = -1;\' }}{% endautoescape %}'))
            .be.eql('\\u0022special\\u0022 chars \\u003D \\u002D1\\u003B');
    });

    it('{% autoescape false %} turns escaping off', function () {
        let swig = new Swig({ autoescape: true });
        should(swig.render('{% autoescape false %}{{ "<foo>" }}{% endautoescape %}{{ "<bar>" }}'))
            .be.eql('<foo>&lt;bar&gt;');
    });

    it('{% autoescape whatthewhat %} throws because unknown argument', function () {
        should.throws(function () {
            swig.render('{% autoescape whatthewhat %}huh?{% endautoescape %}', { filename: 'foobar' });
        }, 'Unexpected token "whatthewhat" in autoescape tag on line 1 in file foobar.');
        should.throws(function () {
            swig.render('{% autoescape true "html" %}huh?{% endautoescape %}');
        }, /Unexpected token ""html"" in autoescape tag on line 1\./)
    });
});
