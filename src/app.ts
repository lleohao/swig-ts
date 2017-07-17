import Swig from './swig';

const swig = Swig.swig;

const tmp = `{% if name %}<h1>Hi {{ name }} !, I am {{ age }} years old.</h1>{% endif %}`;

const result = swig.compile(tmp);

console.log(result({
    name: 'lleohao',
    age: 21
}));