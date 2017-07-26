import { Swig } from '../../lib/swig';
import _ = require('lodash');
import should = require('should');

const swig = new Swig();

describe('Tag: raw', function () {

    it('{% raw %}{{ foo }}{% endraw %}', function () {
        should(swig.render('{% raw %}{{ foo }}{% endraw %}'))
            .be.eql('{{ foo }}');
    });

    it('{% raw %}{% foo %}{% endraw %}', function () {
        should(swig.render('{% raw %}{% foo %}{% endraw %}'))
            .be.eql('{% foo %}');
    });

    it('{% raw %}\n{% if true %}\nstuff\n{% endif %}\n{% endraw %}', function () {
        should(swig.render('{% raw %}\n{% if true %}\nstuff\n{% endif %}\n{% endraw %}'))
            .be.eql('\n{% if true %}\nstuff\n{% endif %}\n');
    });

    it('{% raw %}{# foo #}{% endraw %}', function () {
        should(swig.render('{% raw %}{# foo #}{% endraw %}'))
            .be.eql('{# foo #}');
    });

    it('does not accept arguments', function () {
        should.throws(function () {
            swig.render('{% raw foobar %}foo{% endraw %}');
        }, /Unexpected token "foobar" in raw tag on line 1\./);
    });
});
