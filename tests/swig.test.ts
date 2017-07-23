import * as should from 'should';
import { Swig } from '../lib/swig';

describe('Swig test', () => {
    it('Valiation options test', () => {
        should.throws(() => {
            new Swig({
                varControls: ['<<', '<<']
            })
        })
        should.throws(() => {
            new Swig({
                varControls: ['<', '>']
            })
        })
    })
});
