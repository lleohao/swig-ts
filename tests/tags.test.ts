import { Swig } from '../lib/swig';
import * as should from 'should';

const swig = new Swig();

describe('Tags', function () {
    it('throws on unknown tags', function () {
        should.throws(() => {
            swig.render('\n \n{% foobar %}');
        }, /Unexpected tag "foobar" on line 3\./)
    });

    it('throws on unexpected endtag', function () {
        should.throws(() => {
            swig.render('\n{% if foo %}\n  asdf\n{% endfoo %}');
        }, /Unexpected end of tag "foo" on line 4\./)
    });

    it('can have any set of tokens in end tags', function () {
        should(swig.render('{% if foo %}hi!{% endif the above will render if foo == true %}', { locals: { foo: true } }))
            .be.eql('hi!');
    });

    describe('can be set', function () {
        function parse(str, line, parser, types) {
            return true;
        }
        function compile(compiler, args, content) {
            return compiler(content) + '\n' +
                '_output += " tortilla!"';
        }
        it('and used in templates', function () {
            swig.setTag('tortilla', parse, compile, true);
            should(swig.render('{% tortilla %}flour{% endtortilla %}'))
                .be.eql('flour tortilla!');
        });

        it('and use custom extensions', function () {
            swig.setExtension('tacos', function () { return 'Tacos!'; });
            swig.setTag('tacotag', parse, function (compiler, args, content) {
                return '_output += _ext.tacos();\n';
            });
            should(swig.render('{% tacotag %}')).be.eql('Tacos!');
        });

        it('and throw if are not written correctly', function () {
            should.throws(function () {
                swig.setTag('tacos', null, compile);
            }, /Tag "tacos" parse method is not a valid function\./);
        });
    });
});
