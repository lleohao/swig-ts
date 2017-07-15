import { dirname, normalize, resolve } from 'path';
import utils from '../utils';

import { TemplateLoader } from './index';

/**
 * Hash object with template paths as keys and template sources as values.
 * 
 * @export
 * @interface MemoryInterface
 */
export interface MemoryInterface {
    [key: string]: string;
}

/**
 * Loads templates from a provided object mapping.
 * 
 * @export
 * @param {MemoryInterface} mapping  Hash object with template paths as keys and template sources as values.
 * @param {(string|null)} basepath Path to the templates as string. Assigning this value allows you to use semi-absolute paths to templates instead of relative paths.
 * @returns 
 */
export const memory = (mapping: MemoryInterface, basepath?: string | null) => {
    basepath = (basepath) ? normalize(basepath) : null;

    const vet: TemplateLoader.templateLoader = {
        reslove: (to, from) => {
            if (basepath) {
                from = basepath;
            } else {
                from = (from) ? dirname(from) : '/';
            }
            return resolve(from, to);
        },
        load: (pathname, cb) => {
            let src: string, paths: string[];

            paths = [pathname, pathname.replace(/^(\/|\\)/, '')];

            src = mapping[paths[0]] || mapping[paths[1]];

            if (!src) {
                utils.throwError('Unable to find template "' + pathname + '".');
            }

            if (cb) {
                cb(null, src);
                return;
            }

            return src;
        }
    };

    return vet;
}