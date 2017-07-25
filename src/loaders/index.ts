export { fs } from './filesystem';
export { memory, MemoryInterface } from './memory';

/**
 * Swig is able to accept custom template loaders written by you.
 * So that your templates can come from your favorite storage medium without needing to be part of the core library.
 * A template loader consists of two methods: `resolve` and `load`. 
 * Each method is used internally by Swig to find and load the source of the template before attempting to parse and compile it.
 * 
 * @example
 * // A theoretical memcached loader
 * var path = require('path'),
 *     Memcached = require('memcached');
 * function memcachedLoader(locations, options) {
 *   var memcached = new Memcached(locations, options);
 *   return {
 *     resolve: function (to, from) {
 *       return path.resolve(from, to);
 *     },
 *     load: function (identifier, cb) {
 *       memcached.get(identifier, function (err, data) {
 *         // if (!data) { load from filesystem; }
 *         cb(err, data);
 *       });
 *     }
 *   };
 * };
 * // Tell swig about the loader:
 * swig.setDefaults({ loader: memcachedLoader(['192.168.0.2']) });
 */
export interface TemplateLoader {
    reslove: reslove;
    load: load;
}

/**
 * Resolves `to` to an absolute path or unique identifier. 
 * This is used for building correct, normalized, and absolute paths to a given template.
 * 
 * @param to        Non-absolute identifier or pathname to a file.
 * @param [from]    If given, should attempt to find the to path in relation to this given, known path.
 * @return {string}
 */
export type reslove = (to: string, from?: string) => string;

/**
 * Loads a single template. 
 * Given a unique `identifier` found by the `resolve` method this should return the given template.
 * 
 * @param  identifier  Unique identifier of a template (possibly an absolute path).
 * @param  [cb]        Asynchronous callback function. If not provided, this method should run synchronously.
 * @return {string}
 */
export type load = (identifier: string, cb?: (err: Error | null, data: string) => void) => string | undefined;
