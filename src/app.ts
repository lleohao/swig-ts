import swig from '../src/swig';

const tmp = `<h1>Hi {{ name }} !</h1>`;

const result = swig.compile(tmp);

console.log(result({
    name: 'lleohao'
}));