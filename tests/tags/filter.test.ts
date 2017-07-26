import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');

const swig = new Swig();

const cases = [
  { c: 'upper', e: 'PASS' },
  { c: 'default("foobar")', e: 'pass' },
  { c: 'replace("s", "d", "g")', e: 'padd' },
  { c: 'default(fn("foo"))', e: 'pass' },
  { c: 'default(foo)', e: 'pass' }
];

describe('Tag: filter', function () {
  _.each(cases, function (c) {
    it('{% filter ' + c.c + ' %}', function () {
      should(swig.render('{% filter ' + c.c + '%}pass{% endfilter %}', {
        locals: {
          fn: function (input) { return input; }
        }
      })).be.eql(c.e);
    });
  });

  it('throws on non-existent filter', function () {
    should.throws(function () {
      swig.render('{% filter foobar %}{% endfilter %}');
    }, /Filter \"foobar\" does not exist on line 1\./);
  });
});
