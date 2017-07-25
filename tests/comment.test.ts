import { Swig } from '../lib/swig';
import * as should from 'should';

const swig = new Swig();

describe('Comments', function () {
    it('are ignored and removed from output', function () {
        should(swig.render('{# some content #}')).be.eql('');
        should(swig.render('{# \n can have newlines \r\n in whatever type #}')).be.eql('');
        should(swig.render('{#\n{% extends "layout.twig" %}\n#}')).be.eql('');
    });
});
