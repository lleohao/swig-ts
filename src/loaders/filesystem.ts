import { dirname, normalize, resolve } from 'path';
import { readFileSync, readFile } from 'fs';
import { TemplateLoader } from './index';

/**
 * Loads templates from the file system.
 * 
 * @alias swig.loaders.fs
 * @param basepath  Path to the templates as string. Assigning this value allows you to use semi-absolute paths to templates instead of relative paths.
 * @param encoding  Template encoding
 * @return {TemplateLoader}
 */
export const fs = (basepath: string | null = '', encoding: string = 'utf8'): TemplateLoader => {
    basepath = (basepath) ? normalize(basepath) : null;

    const vet: TemplateLoader = {
        reslove: (to, from) => {
            if (basepath) {
                from = basepath;
            } else {
                from = (from) ? dirname(from) : process.cwd();
            }
            return resolve(from, to);
        },
        load: (identifier, cb) => {
            if (cb) {
                readFile(identifier, encoding, cb);
                return;
            }

            return readFileSync(identifier, encoding);
        }
    };

    return vet;
};
