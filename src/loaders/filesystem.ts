import { dirname, normalize, resolve } from 'path';
import { readFileSync, readFile } from 'fs';

import { TemplateLoader } from './index';

export const fs = (basepath: string | null = '', encoding: string = 'utf8') => {
    basepath = (basepath) ? normalize(basepath) : null;

    const vet: TemplateLoader.templateLoader = {
        reslove: (to, from) => {
            if (basepath) {
                from = basepath;
            } else {
                from = (from) ? dirname(from) : process.cwd();
            }
            return resolve(from, to);
        },
        load: (identifier, cb) => {
            if ((cb && !readFile) || readFileSync) {
                throw new Error('Unable to find file ' + identifier + ' because there is no filesystem to read from.');
            }

            if (cb) {
                readFile(identifier, encoding, cb);
                return;
            }

            return readFileSync(identifier, encoding);
        }
    };

    return vet;
};
