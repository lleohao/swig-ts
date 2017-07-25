import swig, { Swig } from '../lib/swig';
import * as should from 'should';
import * as fs from 'fs';
import * as path from 'path';

describe('swig.loaders', () => {
    describe('Memory', () => {
        it('can use extends', () => {
            let templates, html, s: Swig;

            templates = {
                'page.html': '{% extends "layout.html" %}{% block content %}Hello {{ name }}!{% endblock %}'
            };
            templates[path.sep + 'layout.html'] = '<html>{% block content %}{% endblock %}</html>';

            s = new Swig({ loader: swig.loaders.memory(templates) });
            html = s.renderFile('page.html', { name: 'world' });
            should(html).be.eql('<html>Hello world!</html>');
        });

        it('can use include', () => {
            let templates, s: Swig, html;

            templates = {
                'page.html': '<html>{% include "content.html" %}</html>',
                'content.html': 'Hello {{ name }}!'
            };

            s = new Swig({ loader: swig.loaders.memory(templates) });
            html = s.renderFile('page.html', { name: 'world' });
            should(html).be.eql('<html>Hello world!</html>');
        });


        it('can use base paths', () => {
            let templates, s, html;

            templates = {
                '/baz/bar/page.html': '<html>{% include "content.html" %}</html>',
                '/baz/content.html': 'Hello {{ name }}!'
            };

            s = new Swig({ loader: swig.loaders.memory(templates, '/baz') });
            html = s.renderFile('bar/page.html', { name: 'world' });
            should(html).be.eql('<html>Hello world!</html>');
        });

        it('throws on undefined template', () => {
            let s = new Swig({ loader: swig.loaders.memory({}) });
            should.throws(function () {
                s.renderFile('foobar');
            }, /Unable to find template "\/foobar"\./);
        });

        it('will run asynchronously', (done) => {
            let t = { 'content.html': 'Hello {{ name }}!' },
                s = new Swig({ loader: swig.loaders.memory(t) });
            s.renderFile('/content.html', { name: 'Tacos' }, function (err, out) {
                should(out).be.equal('Hello Tacos!');
                done();
            });
        });
    });

    describe('FileSystem', function () {
        let macroExpectation = '\n\nasfdasdf\n\n\n\n\nHahahahahah!\n\n\n\n\n\n\n\n\n\n';

        it('can take a base path', function () {
            let s = new Swig({ loader: swig.loaders.fs(__dirname + '/cases') });
            should(s.renderFile('macros.html')).be.eql(macroExpectation);
        });

        it('will run asynchronously', function (done) {
            let t = { 'content.html': 'Hello {{ name }}!' },
                s = new Swig({ loader: swig.loaders.fs(__dirname + '/cases') });
            s.renderFile('macros.html', {}, function (err, out) {
                should(out).be.eql(macroExpectation);
                done();
            });
        });

        it('takes cwd as default base path', function () {
            let filepath = path.relative(process.cwd(), __dirname + '/cases/macros.html'),
                s = new Swig();

            should(s.renderFile(filepath)).be.eql(macroExpectation);
        });
    });
})