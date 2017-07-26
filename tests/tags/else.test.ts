import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');

const cases = [
  { code: 'true', result: false },
  { code: 'false', result: true }
];
const swig = new Swig();

describe('Tag: else', function () {

  _.each(cases, function (c) {
    it('{% if ' + c.code + ' %}{% else %}', function () {
      should(swig.render('{% if ' + c.code + ' %}{% else %}pass{% endif %}'))
        .be.eql(c.result ? 'pass' : '');
    });
  });

  it('must be within an {% if %}', function () {
    should.throws(function () {
      swig.render('{% else %}foo');
    }, /Unexpected tag "else" on line 1\./);
  });

  it('does not accept conditionals/args (use elseif, elif)', function () {
    should.throws(function () {
      swig.render('{% if foo %}{% else what %}{% endif %}');
    }, /"else" tag does not accept any tokens. Found "what" on line 1\./);
  });
});

describe('Tag: elseif, elif', function () {

  _.each(cases, function (c) {
    it('{% if ' + (!c.code) + ' %}{% elseif ' + c.code + ' %}', function () {
      should(swig.render('{% if ' + (!c.code) + ' %}{% elseif ' + c.code + ' %}pass{% endif %}'))
        .be.eql(!c.result ? 'pass' : '');
      should(swig.render('{% if ' + (!c.code) + ' %}{% elif ' + c.code + ' %}pass{% endif %}'))
        .be.eql(!c.result ? 'pass' : '');
    });
  });

  it('{% if false %}{% elseif foo > 1 %}', function () {
    should(swig.render('{% if false %}{% elseif foo > 1 %}pass{% endif %}', { locals: { foo: 5 } }))
      .be.eql('pass');
  });

  it('must be within an {% if %}', function () {
    should.throws(function () {
      swig.render('{% elseif true %}foo');
    }, /Unexpected tag "elseif" on line 1\./);
  });

  it('requires a conditional', function () {
    should.throws(function () {
      swig.render('{% if true %}{% elif %}foo');
    }, /No conditional statement provided on line 1\./);
  });
});
