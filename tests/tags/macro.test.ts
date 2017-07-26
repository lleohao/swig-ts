import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');

const swig = new Swig();

describe('Tag: macro', function () {
    it('{% macro tacos() %}', function () {
        should(swig.render('{% macro tacos() %}tacos{% endmacro %}{{ tacos() }}'))
            .be.eql('tacos');
    });

    it('{% macro tacos(a, b, c) %}', function () {
        should(swig.render('{% macro tacos(a, b, c) %}{{ a }}, {{ c }}, {{ b }}{% endmacro %}{{ tacos(1, 3, 2) }}'))
            .be.eql('1, 2, 3');
    });

    it('does not auto-escape', function () {
        should(swig.render('{% macro foo %}<h1>{{ "<p>" }}</h1>{% endmacro %}{{ foo() }}'))
            .be.eql('<h1>&lt;p&gt;</h1>');
    });

    it('throws on bad argument names', function () {
        should.throws(function () {
            swig.render('{% macro tacos(burrito.bean) %}{% endmacro %}');
        }, /Unexpected dot in macro argument "burrito\.bean" on line 1\./);
        should.throws(function () {
            swig.render('{% macro tacos(burrito), asdf) %}{% endmacro %}');
        }, /Unexpected parenthesis close on line 1\./);
    });

    it('gh-457: local context is copied and overwritten within macro context', function () {
        should(swig.render('{% set foo = 1 %}{% set baz = 3 %}{% macro bar(foo) %}{{ foo }}{{ baz }}{% endmacro %}{{ bar(2) }}{{ foo }}')).be.eql('231');
    });

    it('gh-499: a macro can be set to a variable', function () {
        should(swig.render('{% macro burrito() %}burrito{% endmacro %}{% set foo = burrito() %}{{foo}}')).be.eql('burrito');
    });
});
