import { Swig } from '../lib/swig';
import should = require('should');

const opts = {
    locals: {
        tacos: 'tacos'
    }
};
const swig = new Swig();

describe('Whitespace', function () {
    describe('strips before', function () {
        it('"burritos\\n \\n{{- tacos }}\\n"', function () {
            should(swig.render('burritos\n \n{{- tacos }}\n', opts))
                .be.eql('burritostacos\n');
        });
        it('"burritos\\n \\n{%- if tacos %}\\ntacos\\r\\n{%- endif %}\\n"', function () {
            should(swig.render('burritos\n \n{%- if tacos %}\ntacos\r\n{%- endif %}\n', opts))
                .be.eql('burritos\ntacos\n');
        });
    });

    describe('strips after', function () {
        it('"burritos\\n \\n{{ tacos -}}\\n"', function () {
            should(swig.render('burritos\n \n{{ tacos -}}\n', opts))
                .be.eql('burritos\n \ntacos');
        });
        it('"burritos\\n \\n{% if tacos -%}\\ntacos\\r\\n{% endif -%}\\n"', function () {
            should(swig.render('burritos\n \n{% if tacos -%}\ntacos\n{% endif -%}\n', opts))
                .be.eql('burritos\n \ntacos\n');
        });
    });

    describe('strips both', function () {
        it('"burritos\\n \\n{{- tacos -}}\\n"', function () {
            should(swig.render('burritos\n \n{{- tacos -}}\n', opts))
                .be.eql('burritostacos');
        });
        it('"burritos\\n \\n{%- if tacos -%}\\ntacos\\r\\n{%- endif -%}\\n"', function () {
            should(swig.render('burritos\n \n{%- if tacos -%}\ntacos\n{%- endif -%}\n', opts))
                .be.eql('burritostacos');
        });
    });
});
