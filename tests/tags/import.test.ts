import { Swig } from '../../lib/swig';
import should = require('should');

const swig = new Swig();

describe('Tag: import', function () {
    it('throws on bad arguments', function () {
        should.throws(function () {
            swig.render('{% import bar %}');
        }, /Unexpected variable "bar" on line 1\./);
        should.throws(function () {
            swig.render('{% import "' + __dirname + '/../cases/import.test.html' + '" "bar" %}');
        }, /Unexpected string "bar" on line 1\./);
    });
});
