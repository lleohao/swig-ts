import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');

const swig = new Swig();

var cases = [
  { input: '{% for a in b %}{{ a }}{% endfor %}', out: '123' },
  { input: '{% for a in [1,2,3] %}{{ a }}{% endfor %}', out: '123' },
  { input: '{% for a in b %}{{ loop.index }}{% endfor %}', out: '123' },
  { input: '{% for a in c %}{{ loop.index }}{% endfor %}', out: '12' },
  { input: '{% for a in b %}{{ loop.index0 }}{% endfor %}', out: '012' },
  { input: '{% for a in c %}{{ loop.index0 }}{% endfor %}', out: '01' },
  { input: '{% for a in b %}{{ loop.revindex }}{% endfor %}', out: '321' },
  { input: '{% for a in c %}{{ loop.revindex }}{% endfor %}', out: '21' },
  { input: '{% for a in b %}{{ loop.revindex0 }}{% endfor %}', out: '210' },
  { input: '{% for a in c %}{{ loop.revindex0 }}{% endfor %}', out: '10' },
  { input: '{% for a in b %}{{ loop.key }}{% endfor %}', out: '012' },
  { input: '{% for a in c %}{{ loop.key }}{% endfor %}', out: 'ab' },
  { input: '{% for a,b in b %}{{ loop.key }}{% endfor %}', out: '012' },
  { input: '{% for a,b in c %}{{ loop.key }}{% endfor %}', out: 'ab' },
  { input: '{% for a in b %}{{ loop.first }}, {% endfor %}', out: 'true, false, false, ' },
  { input: '{% for a in b %}{{ loop.last }}, {% endfor %}', out: 'false, false, true, ' },
  { input: '{% for a in c %}{{ loop.first }}, {% endfor %}', out: 'true, false, ' },
  { input: '{% for a in c %}{{ loop.last }}, {% endfor %}', out: 'false, true, ' },
  { input: '{% for a,b in b %}{{ a }}{{ b }}{% endfor %}', out: '011223' },
  { input: '{% for a, b in c %}{{ b }}{% endfor %}', out: 'applebanana' },
  { input: '{% for a in d|default(["a"]) %}{{ a }}{% endfor %}', out: 'a' },
  { input: '{% for a in q %}hi{% endfor %}', out: '' },
  { input: '{% for a in b %}{% for d in c %}{% for a in b %}{% endfor %}{% endfor %}{% if loop.last %}last happens only once{% endif %}{% endfor %}', out: 'last happens only once' },
  { input: '{% for a in "foobar"|reverse %}{{ a }}{% endfor %}', out: "raboof" }
];

describe('Tag: for', function () {
  var opts = {
    locals: {
      b: [1, 2, 3],
      c: { 'a': 'apple', 'b': 'banana' }
    }
  };
  _.each(cases, function (c) {
    it(c.input + ' should render "' + c.out + '"', function () {
      should(swig.render(c.input, opts)).be.eql(c.out);
    });
  });

  it('resets loop and vars', function () {
    should(swig.render('{% for a, b in c %}{% endfor %}{{ a }}{{ b }}{{ loop }}', { locals: { loop: 'z', a: 'x', b: 'y', c: { d: 'e', f: 'g' } } }))
      .be.eql('xyz');
  });

  it('throws on numbers as any argument', function () {
    should.throws(function () {
      swig.render('{% for a in 32 %}{% endfor %}');
    }, /Unexpected number "32" on line 1\./);
  });

  it('throws on any comparator', function () {
    should.throws(function () {
      swig.render('{% for a > 32 %}{% endfor %}');
    }, /Unexpected token ">" on line 1\./);
  });

});
