import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');

const swig = new Swig();

var opts = {
    locals: {
        foo: 1,
        bar: 0,
        baz: [1]
    }
};

var cases = [
  { code: 'foo',                result: true },
  { code: 'true',               result: true },
  { code: 'false',              result: false },
  { code: 'foo > bar',          result: true },
  { code: 'foo gt bar',         result: true },
  { code: 'foo >= foo',         result: true },
  { code: 'foo gte bar',        result: true },
  { code: 'foo >= bar',         result: true },
  { code: 'foo < bar',          result: false },
  { code: 'foo lt bar',         result: false },
  { code: 'bar <= bar',         result: true },
  { code: 'foo <= bar',         result: false },
  { code: 'foo lte bar',        result: false },
  { code: 'foo !== bar',        result: true },
  { code: 'foo != bar',         result: true },
  { code: '!foo',               result: false },
  { code: 'not foo',            result: false },
  { code: '!bar',               result: true },
  { code: 'not bar',            result: true },
  { code: 'foo in baz',         result: false },
  { code: 'bar in baz',         result: true },
  { code: '1 < 0',              result: false },
  { code: '"a" === "a"',        result: true },
  { code: '1 === foo',          result: true },
  { code: '1 === bar',          result: false },
  { code: 'true && false',      result: false },
  { code: '0 || (bar && foo)',  result: false },
  { code: 'not (2 in baz)',     result: true }
];

describe('Tag: if', function () {

    _.each(cases, function (c) {
        it('{% if ' + c.code + ' %}', function () {
            should(swig.render('{% if ' + c.code + '%}pass{% endif %}', opts))
                .be.eql(c.result ? 'pass' : '');
        });
    });

    it('requires a conditional', function () {
        should.throws(function () {
            swig.render('{% if %}tacos{% endif %}');
        }, /No conditional statement provided on line 1\./);
    });

    it('throws on bad logic', function () {
        const baddies = [
            ['{% if && foo %}{% endif %}', /Unexpected logic "\&\&" on line 1\./],
            ['{% if foo && %}{% endif %}', /Unexpected logic "\&\&" on line 1\./],
            ['{% if foo > %}{% endif %}', /Unexpected logic ">" on line 1\./],
            ['{% if foo ! %}{% endif %}', /Unexpected logic "\!" on line 1\./],
            ['{% if foo not in bar %}{% endif %}', /Attempted logic "not in" on line 1\. Use \!\(foo in\) instead\./]
        ];
        _.each(baddies, function (b) {
            should.throws(function () {
                swig.render((b[0] as string), opts);
            }, b[1]);
        });
    });
});
