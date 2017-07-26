import { Swig } from '../../lib/swig';
import should = require('should');

const swig = new Swig();

describe('Tag: extends', function () {
  it('throws if template has no filename', function () {
    should.throws(function () {
      swig.render('{% extends "foobar" %}');
    }, /Cannot extend "foobar" because current template has no filename\./);
  });
});
