import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');

const swig = new Swig();

var cases = [{
    c: '{% spaceless %} <p> foo </p> <p>bar</p> {% endspaceless %}',
    e: '<p> foo </p><p>bar</p>'
},
{
    c: '{% spaceless %}{% if true %}<p></p> <p></p>{% endif %}{% endspaceless %}',
    e: '<p></p><p></p>'
},
{
    c: '{% spaceless %}{% if false %}{% else %}<p></p> <p></p>{% endif %}{% endspaceless %}',
    e: '<p></p><p></p>'
},
{
    c: '{% spaceless %}{% macro foo %}<p></p> <p></p>{% endmacro %}{% endspaceless %}{{ foo() }}',
    e: '<p></p> <p></p>'
},
{
    c: '{% macro foo %}<p></p> <p></p>{% endmacro %}{% spaceless %}{{ foo() }}{% endspaceless %}',
    e: '<p></p><p></p>'
}
];

describe('Tag: spaceless', function () {
    _.each(cases, function (c) {
        it(c.c, function () {
            should(swig.render(c.c)).be.eql(c.e);
        });
    });

    it('Throws on tokens', function () {
        should.throws(function () {
            swig.render('{% spaceless foobar %}{% endfilter %}');
        }, /Unexpected token \"foobar\" on line 1\./);
    });
});
