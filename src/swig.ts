import * as utils from './utils';
import { fs, TemplateLoader } from './loaders';

export namespace Swig {
    export interface obj {
        [key: string]: any;
    }

    export interface CacheOptions {
        get: (key: string) => string;
        set: (key: string, val: string) => boolean;
    }

    /**
     * Swig Options Object. This object can be passed to many of the API-level Swig methods to control various aspects of the engine. All keys are optional.
     * 
     * @export
     * @memberof Swig
     * @interface DefaultOptions
     */
    export interface Options extends Object {
        /**
         * Controls whether or not variable output will automatically be escaped for safe HTML output. Defaults to <code data-language="js">true</code>. Functions executed in variable statements will not be auto-escaped. Your application/functions should take care of their own auto-escaping.
         * 
         * @type {boolean}
         * @memberOf DefaultOptions
         */
        autoescape?: boolean;
        /**
         * Open and close controls for variables. Defaults to <code data-language="js">['{{', '}}']</code>.
         * 
         * @type {string[]}
         * @memberOf DefaultOptions
         */
        varControls?: string[];
        /**
         * Open and close controls for tags. Defaults to <code data-language="js">['{%', '%}']</code>.
         * 
         * @type {string[]}
         * @memberOf DefaultOptions
         */
        tagControls?: string[];
        /**
         * Open and close controls for comments. Defaults to <code data-language="js">['{#', '#}']</code>.
         * 
         * @type {string[]}
         * @memberOf DefaultOptions
         */
        cmtControls?: string[];
        /**
         * Default variable context to be passed to <strong>all</strong> templates.
         * 
         * @type {obj}
         * @memberOf DefaultOptions
         */
        locals?: obj;
        /**
         * Cache control for templates. Defaults to saving in <code data-language="js">'memory'</code>. Send <code data-language="js">false</code> to disable. Send an object with <code data-language="js">get</code> and <code data-language="js">set</code> functions to customize.
         * 
         * @type {boolean|string|CacheOptions}
         * @memberOf DefaultOptions
         */
        cache?: boolean | string | CacheOptions;
        /**
         * The method that Swig will use to load templates. Defaults to <var>swig.loaders.fs</var>.
         * 
         * @type {TemplateLoader.templateLoader}
         * @memberOf DefaultOptions
         */
        loader?: TemplateLoader.templateLoader;
        [key: string]: any;
    }
}


/**
 * Swig version number as string.
 * @example 
 * if (swig.version === '0.0.1') { ... }
 */
export const version: string = '0.0.1';


const defaultOptions: Swig.Options = {
    autoescape: true,
    varControls: ['{{', '}}'],
    tagControls: ['{%', '%}'],
    cmtControls: ['{#', '#}'],
    locals: {},
    /**
     * Cache control for templates. Defaults to saving all templates into memory.
     * @example
     * // Default
     * swig.setDefaults({ cache: 'memory' });
     * @example
     * // Disables caching in Swig.
     * swig.setDefaults({ cache: false });
     * @example
     * // Custom cache storage and retrieval
     * swig.setDefaults({
     *   cache: {
     *     get: function (key) { ... },
     *     set: function (key, val) { ... }
     *   }
     * }); 
     */
    cache: 'memory',
    /**
     * Configure Swig to use either the <var>swig.loaders.fs</var> or <var>swig.loaders.memory</var> template loader. Or, you can write your own!
     * For more information, please see the <a href="../loaders/">Template Loaders documentation</a>.
     * @example
     * // Default, FileSystem loader
     * swig.setDefaults({ loader: swig.loaders.fs() });
     * @example
     * // FileSystem loader allowing a base path
     * // With this, you don't use relative URLs in your template references
     * swig.setDefaults({ loader: swig.loaders.fs(__dirname + '/templates') });
     * @example
     * // Memory Loader
     * swig.setDefaults({ loader: swig.loaders.memory({
     *   layout: '{% block foo %}{% endblock %}',
     *   page1: '{% extends "layout" %}{% block foo %}Tacos!{% endblock %}'
     * })}); 
     */
    loader: fs()
};
let defaultInstance;

/**
 * Empty function, used in templates.
 * @return {string} Empty string
 * @private
 */
function efn() { return '' };

function validateOptions(options: Swig.Options) {
    utils.each(['varControls', 'tagControls', 'cmtControls'], (key: string) => {
        if (!options.hasOwnProperty(key)) {
            return;
        }
        let value = <string[]>options[key];

        if (!utils.isArray(value) || value.length !== 2) {
            throw new Error(`Options "${key}" must be an array containing 2 different control strings.`);
        }

        if (value[0] === value[1]) {
            throw new Error(`Options "${key}" open and close controls must not be the same.`);
        }

        utils.each(options[key], function (a: string[], i: number) {
            if (a.length < 2) {
                throw new Error('Option "' + key + '" ' + ((i) ? 'open ' : 'close ') + 'control must be at least 2 characters. Saw "' + a + '" instead.');
            }
        });
    });
}

/**
 * Create a new, separate Swig compile/render environment.
 * 
 * @example
 * var swig = require('swig');
 * var myswig = new swig.Swig({varControls: ['<%=', '%>']});
 * myswig.render('Tacos are <%= tacos =>!', { locals: { tacos: 'delicious' }});
 * // => Tacos are delicious!
 * swig.render('Tacos are <%= tacos =>!', { locals: { tacos: 'delicious' }});
 * // => 'Tacos are <%= tacos =>!'
 *  
 * @export
 * @class Swig
 */
export class Swig {
    private options: Swig.Options;
    private cache: { [key: string]: string };
    private extensions: {};
    private filter: { [key: string]: Function  };

    /**
     * Creates an instance of Swig.
     * @param {Swig.Options} opts 
     * 
     * @memberOf Swig
     */
    constructor(opts: Swig.Options = {}) {
        validateOptions(opts);
        this.options = utils.extend({}, defaultOptions, opts);
        this.cache = {};
        this.extensions = {};
        this.filter = {};
    }

    private getLocals(options?: Swig.Options) {
        if (!options || !options.locals) {
            return this.options.locals;
        }

        return utils.extend({}, this.options.locals, options.locals);
    }

    private shouldCache(options: Swig.Options = {}) {
        return (options.hasOwnProperty('cache') && !options.cache) || !this.options.cache;
    }

    private cacheGet(key: string, options: Swig.Options) {
        if (this.shouldCache(options)) {
            return;
        }

        if (this.options.cache === 'memory') {
            return this.cache[key];
        }

        return (<Swig.CacheOptions>this.options.cache).get(key);
    }

    private cacheSet(key: string, options: Swig.Options, val: string) {
        if (this.shouldCache(options)) {
            return;
        }

        if (this.options.cache === 'memory') {
            this.cache[key] = val;
            return;
        }

        (<Swig.CacheOptions>this.options.cache).set(key, val);
    }

    invalidateCache() {
        if (this.options.cache === 'memory') {
            this.cache = {};
        }
    }

    setFilter(name: string, method: (input: string) => string) {
        this.filter[name] = method;
    }

}
