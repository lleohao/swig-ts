import utils from './utils';
import _filters, { Filters } from './filters';
import tags, { Tags, CompileFunction, ParseFunction } from './tags';
import { fs, TemplateLoader } from './loaders';
import dateformatter from './dateformat';
import parser, { ParseToken } from './parser';
import { LexerToken } from './lexer';

export type TemplateCompiled = (locals?: {}) => string;
export interface CacheOptions {
    get: (key: string) => TemplateCompiled;
    set: (key: string, val: TemplateCompiled) => boolean;
}

/**
 * Swig Options Object. 
 * This object can be passed to many of the API-level Swig methods to control various aspects of the engine. 
 * All keys are optional.
 * 
 * @export
 * @interface SwigOptions
 */
export interface SwigOptions extends Object {
    /**
     * Controls whether or not variable output will automatically be escaped for safe HTML output. 
     * Functions executed in variable statements will not be auto-escaped. 
     * Your application/functions should take care of their own auto-escaping.
     * 
     * @type {boolean}
     * @default true
     */
    autoescape?: boolean;
    /**
     * Open and close controls for variables.
     * 
     * @type {string[]}
     * @default ['{{', '}}']
     */
    varControls?: string[];
    /**
     * Open and close controls for tags.
     * 
     * @type {string[]}
     * @default ['{%', '%}']
     */
    tagControls?: string[];
    /**
     * Open and close controls for comments.
     * 
     * @type {string[]}
     * @default ['{#', '#}']
     */
    cmtControls?: string[];
    /**
     * Default variable context to be passed to <strong>all</strong> templates.
     * 
     * @type {object}
     */
    locals?: {};
    /**
     * Cache control for templates. Send false to disable. Send an object with get and set functions to customize.
     * 
     * @type {boolean|CacheOptions}
     * @default true
     */
    cache?: boolean | CacheOptions;
    /**
     * The method that Swig will use to load templates. Defaults to swig.loaders.fs.
     * 
     * @type {TemplateLoader.templateLoader}
     */
    loader?: TemplateLoader.templateLoader;
    /**
     * Resolve path
     * 
     * @type {string}
     */
    resolveFrom?: string;
    /**
     * Template file name. Don't send any value to this property.
     * 
     * @type {string}
     */
    filename?: string;
}


/**
 * Swig version number as string.
 * @example
 * if (swig.version === '1.0.1') { ... }
 */
const version: string = '1.0.1';


const defaultOptions: SwigOptions = {
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
    cache: true,
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
let defaultInstance: Swig;

/**
 * Empty function, used in templates.
 * @return {string} Empty string
 * @private
 */
function efn() { return '' }

function validateOptions(options: SwigOptions) {
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
 * Set defaults for the base and all new Swig environments.
 * 
 * @example
 * swing.setDefaut({ case: fales });
 * // ==> Disabled Cache
 * 
 * @example
 * swig.setDefaults({ locals: { now: function () { return new Date(); } }});
 * // => sets a globally accessible method for all template
 * //    contexts, allowing you to print the current date
 * // => {{ now()|date('F jS, Y') }}
 * 
 * @param options 
 */
const setDefaults = function (options: SwigOptions = {}): void {
    validateOptions(options);
    defaultInstance.options = utils.extend(defaultInstance.options, options);
};


/**
 * Set the default TimeZone offset for date formatting via the date filter. This is a global setting and will affect all Swig environments, old or new.
 * @param  {number} offset Offset from GMT, in minutes.
 * @return {undefined}
 */
const setDefaultTZOffset = function (offset) {
    dateformatter.tzOffset = offset;
};

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
    options: SwigOptions;
    cache: { [key: string]: TemplateCompiled };
    extensions: {};
    filters: Filters;
    tags: Tags;

    /**
     * Creates an instance of Swig.
     *
     * @memberOf Swig
     */
    constructor(opts: SwigOptions = {}) {
        validateOptions(opts);
        this.options = utils.extend({}, defaultOptions, opts);
        this.cache = {};
        this.extensions = {};
        this.filters = _filters;
        this.tags = tags;
    }

    /**
     * Get combined locals context.
     * 
     * @private
     * @param {SwigOptions} [options] 
     * @returns {object}
     * @memberof Swig
     */
    private getLocals(options: SwigOptions = {}): Object {
        if (!options || !options.locals) {
            return this.options.locals;
        }

        return utils.extend({}, this.options.locals, options.locals);
    }

    /**
     * Determine whether caching is enabled via the options provided and/or default.
     * 
     * @private
     * @param [options={}] 
     * @returns 
     * @memberof Swig
     */
    private shouldCache(options: SwigOptions = {}): boolean {
        return (options.hasOwnProperty('cache') && !options.cache) || !this.options.cache;
    }

    /**
     * Get compield template from the cache.
     * 
     * @private
     * @param {string} key              Name of template.
     * @param {Object} options          Template function and tokens.
     * @returns 
     * @memberof Swig
     */
    private cacheGet(key: string, options?: Object) {
        if (this.shouldCache(options)) {
            return;
        }

        if (this.options.cache) {
            return this.cache[key];
        }

        return (<CacheOptions>this.options.cache).get(key);
    }

    /**
     * Store a template in the cache.
     * 
     * @private
     * @param {string} key              Name of template.
     * @param {Object} options          Template function and tokens.
     * @param {string} val              Template function and tokens.
     * @returns 
     */
    private cacheSet(key: string, options: SwigOptions, val: TemplateCompiled) {
        if (this.shouldCache(options)) {
            return;
        }

        if (this.options.cache) {
            this.cache[key] = val;
            return;
        }

        (<CacheOptions>this.options.cache).set(key, val);
    }

    /**
     * Clears the in-memory template cache.
     *
     * @example
     * swig.invalidateCache();
     *
     * @return {undefined}
     */
    public invalidateCache() {
        if (this.options.cache) {
            this.cache = {};
        }
    }

    /**
     * Add a custom filter for swig variable.
     * 
     * @example
     * function replaceMs(input) { return input.replace(/m/g, 'f'); }
     * swig.setFilter('replaceMs', replaceMs);
     * // => {{ "onomatopoeia"|replaceMs }}
     * // => onofatopeia
     * 
     * @param {string} name                         Name of filter, used in templates. Will overwrite previously defined filters, if using same name.
     * @param {(input: string) => string} method    Function that acts against the input.
     */
    setFilter(name: string, method: (input: string) => string): void {
        this.filters[name] = method;
    }

    /**
     * Add a custom tag. To expose your own extensions to compiled template code.
     * 
     * For a more in-depth explanation of writing custom
     * @example
     * var tacotag = require('./tacotag');
     * swig.setTag('tacos', tacotag.parse, tacotag.compile, tacotag.ends, tacotag.blockLevel);
     * // => {% tacos %}Make this be tacos.{% endtacos %}
     * // => Tacos tacos tacos tacos.
     * 
     * @param {string} name                 Tag name. 
     * @param {ParseFunction} parse              Method for parsing tokens.
     * @param {CompileFunction} compile            Method for compiling renderable output.
     * @param {boolean} [ends=false]        Whether or no this tag requires an end tag.
     * @param {boolean} [blockLevel=false]  If false, this tag will not be compiled outside of block tag when extending a parent template.
     */
    setTag(name: string, parse: ParseFunction, compile: CompileFunction, ends: boolean = false, blockLevel: boolean = false) {
        this.tags[name] = {
            parse: parse,
            compile: compile,
            ends: ends,
            block: blockLevel
        }
    }

    /**
     * Add extensions for custom tags. This allows any custom tag to access a globally available methods via a special globally available object, <var>_ext</var>, in templates.
     *
     * @example
     * swig.setExtension('trans', function (v) { return translate(v); });
     * function compileTrans(compiler, args, content, parent, options) {
     *   return '_output += _ext.trans(' + args[0] + ');'
     * };
     * swig.setTag('trans', parseTrans, compileTrans, true);
     *
     * @param  {string} name   Key name of the extension. Accessed via <code data-language="js">_ext[name]</code>.
     * @param  {*}      object The method, value, or object that should be available via the given name.
     * @return {undefined}
     */
    setExtension(name: string, object) {
        this.extensions[name] = object;
    };

    /**
     * Parse a given source string into tokens.
     * 
     * @param {string} source               Swig template source.
     * @param {SwigOptions} [options={}]    Swig options object.
     */
    parse(source: string, options: SwigOptions = {}): ParseToken {
        validateOptions(options);
        let locals = this.getLocals(options),
            opts = {},
            k;

        for (k in options) {
            if (options.hasOwnProperty(k) && k !== 'locals') {
                opts[k] = options[k];
            }
        }

        options = utils.extend({}, this.options, opts);
        options.locals = locals;

        return parser.parse(this, source, options, this.tags, this.filters);
    }

    /**
     * Parse a given file into tokens.
     * 
     * @param {string} pathname             Full path to file to parse.
     * @param {SwigOptions} [options={}]    Swig optiosn object.
     */
    parseFile(pathname: string, options: SwigOptions = {}) {
        let src;

        pathname = this.options.loader.reslove(pathname, options.resolveFrom);

        src = this.options.loader.load(pathname);

        if (!options.filename) {
            options = utils.extend({ filename: pathname }, options);
        }

        return this.parse(src, options);
    }

    /**
     * Re-Map blocks within a list of tokens to the templatae's block objecs.
     * @param blocks 
     * @param tokens 
     */
    private remapBlocks(blocks: {}, tokens: ParseToken): LexerToken[] {
        return <LexerToken[]>utils.map(tokens, (token) => {
            let args = token.args ? token.args.join('') : '';
            if (token.name === 'block' && blocks[args]) {
                token = blocks[args];
            }
            if (token.content && token.content.length) {
                token.content = this.remapBlocks(blocks, token.content);
            }
            return token;
        })
    }

    /**
     * Import block-level tags to the token list that are not actual block tags.
     * @param blocks List of block-level tags.
     * @param tokens List of tokens to render.
     */
    private importNonBlocks(blocks, tokens) {
        let temp = [];
        utils.each(blocks, (block) => {
            temp.push(block);
        });
        utils.each(temp.reverse(), (block) => {
            tokens.unshift(block);
        });
    }

    /**
     * Rrecursively compile and get parents of given parsed token object.
     * 
     * @private
     * @param {object} tokens               Parsed tokens from templates.
     * @param {SwigOptions} [options={}]    Swign options object.
     * @return {object}                     Parsed tokens from templates.
     */
    private getParents(tokens, options: SwigOptions = {}) {
        let parentName = tokens.parent,
            parentFiles = [],
            parents = [],
            parentFile,
            parent,
            l;

        while (parentName) {
            if (!options.filename) {
                throw new Error(`Cannot extend "${parentName}" because current template has no filename`);
            }

            parentFile = parentFile || options.filename;
            parentFile = this.options.loader.reslove(parentName, parentFile);
            parent = this.cacheGet(parentFile, options) || this.parseFile(parentFile, utils.extend({}, options, { filename: parentFile }));
            parentName = parent.parent;

            if (parentFile.indexOf(parentFile) !== -1) {
                throw new Error(`Illegal circular ectends of "${parentFile}".`);
            }
            parentFiles.push(parentFile);

            parents.push(parent);
        }

        for (l = parents.length - 2; l >= 0; l -= 1) {
            parents[l].tokens = this.remapBlocks(parents[l].blocks, parents[l + 1].tokens);
            this.importNonBlocks(parents[l].blocks, parents[l].tokens);
        }

        return parents;
    }

    /**
     * Pre-compile a source string to a cache-able template function.
     * 
     * @example
     * swig.preCompile('{{ tacos }}');
     * // => {
     * //      tpl: function (_swig, _locals, _filters, _utils, _fn) { ... },
     * //      tokens: {
     * //        name: undefined,
     * //        parent: null,
     * //        tokens: [...],
     * //        blocks: {}
     * //      }
     * //    }
     * 
     * In order to render a pre-compiled template, you must have access to filter and utils from Swig. efn is simply an empty function that does nothing.
     * 
     * @param {string} source 
     * @param {SwigOptions} options 
     * @memberof Swig
     */
    preCompile(source: string, options: SwigOptions): { tpl: Function, tokens: ParseToken } {
        let tokens = this.parse(source, options),
            parents = this.getParents(tokens, options),
            tpl;

        if (parents.length) {
            tokens.tokens = this.remapBlocks(tokens.blocks, parents[0].tokens);
            this.importNonBlocks(tokens.blocks, tokens.tokens);
        }

        try {
            tpl = new Function('_swig', '_ctx', '_filters', '_utils', '_fn',
                '  var _ext = _swig.extensions,\n' +
                '    _output = "";\n' +
                parser.compile(tokens, parents, options) + '\n' +
                '  return _output;\n'
            );
        } catch (error) {
            utils.throwError(error, null, options.filename);
        }

        return { tpl: tpl, tokens: tokens };
    }

    /**
     * Compile and render a template string for final output.
     * 
     * When rendering a source string, a file path should be specified in the options in order for extends, include, and import to work properly. Do this by adding {filename: '/absolute/path/to/mytpl.html'} to optionss argement.
     * 
     * @example
     * swig.render('{{ tocas }}', {locals: {tacos: 'Tacos!!!'}});
     * // ==> Tacos!!!!
     * 
     * @param source          Swig template string.
     * @param [options={}]    Swig options object.
     */
    render(source: string, options: SwigOptions = {}) {
        return this.compile(source, options)();
    };

    /**
     * Compile and render a template file for final output. This is most useful for libraries like Express.js.
     *
     * @example
     * swig.renderFile('./template.html', {}, function (err, output) {
     *   if (err) {
     *     throw err;
     *   }
     *   console.log(output);
     * });
     *
     * @example
     * swig.renderFile('./template.html', {});
     * // => output
     *
     * @param  {string}   pathName    File location.
     * @param  {object}   [locals={}] Template variable context.
     * @param  {Function} [cb] Asyncronous callback function. If not provided, <var>compileFile</var> will run syncronously.
     * @return {string}             Rendered output.
     */
    renderFile(pathName, locals, cb) {
        if (cb) {
            this.compileFile(pathName, {}, function (err, fn) {
                let result;

                if (err) {
                    cb(err);
                    return;
                }

                try {
                    result = fn(locals);
                } catch (err2) {
                    cb(err2);
                    return;
                }

                cb(null, result);
            });
            return;
        }

        return this.compileFile(pathName)(locals);
    };


    /**
     * Compile string source into a renderable template function.
     *
     * @example
     * var tpl = swig.compile('{{ tacos }}');
     * // => {
     * //      [Function: compiled]
     * //      parent: null,
     * //      tokens: [{ compile: [Function] }],
     * //      blocks: {}
     * //    }
     * tpl({ tacos: 'Tacos!!!!' });
     * // => Tacos!!!!
     *
     * When compiling a source string, a file path should be specified in the options object in order for <var>extends</var>, <var>include</var>, and <var>import</var> to work properly. Do this by adding <code data-language="js">{ filename: '/absolute/path/to/mytpl.html' }</code> to the options argument.
     *
     * @param  {string}         source      Swig template source string.
     * @param  {SwigOptions}    options     Swig options.
     * @return {function}                   Renderable function with keys for parent, blocks, and tokens.
     */
    compile(source: string, options: SwigOptions = {}): TemplateCompiled {
        let key = options ? options.filename : null,
            cached = key ? this.cacheGet(key) : null,
            filters = this.filters,
            context,
            contextLength,
            pre;

        if (cached) {
            return cached;
        }

        context = this.getLocals(options);
        contextLength = utils.keys(context).length;
        pre = this.preCompile(source, options);

        function compiled(locals) {
            let lcls;
            if (locals && contextLength) {
                lcls = utils.extend({}, context, locals);
            } else if (locals && !contextLength) {
                lcls = locals;
            } else if (!locals && contextLength) {
                lcls = context;
            } else {
                lcls = {};
            }

            return pre.tpl(this, lcls, filters, utils, efn);
        }

        utils.extend(compiled, pre.tokes);

        if (key) {
            this.cacheSet(key, options, compiled);
        }

        return compiled.bind(this);
    }


    compileFile(pathname: string, options: SwigOptions = {}, cb?: Function): Function {
        let src, cached;

        pathname = this.options.loader.reslove(pathname, options.resolveFrom);
        if (!options.filename) {
            options = utils.extend({ filename: pathname }, options);
        }
        cached = this.cacheGet(pathname, options);

        if (cached) {
            if (cb) {
                cb(null, cached);
                return;
            }
            return cached;
        }

        if (cb) {
            this.options.loader.load(pathname, (err, src) => {
                if (err) {
                    cb(err);
                    return;
                }

                let compield;

                try {
                    compield = this.compile(src, options);
                } catch (err2) {
                    cb(err2);
                    return;
                }

                cb(err, compield);
            });
            return;
        }

        src = this.options.loader.load(pathname);
        return this.compile(src, options);
    }

    /**
     * Run a pre-compiled template function. This is most useful in the browser when you've pre-compiled your templates with the Swig command-line tool.
     *
     * @example
     * $ swig compile ./mytpl.html --wrap-start="var mytpl = " > mytpl.js
     * @example
     * <script src="mytpl.js"></script>
     * <script>
     *   swig.run(mytpl, {});
     *   // => "rendered template..."
     * </script>
     *
     * @param  {function} tpl       Pre-compiled Swig template function. Use the Swig CLI to compile your templates.
     * @param  {object} [locals={}] Template variable context.
     * @param  {string} [filepath]  Filename used for caching the template.
     * @return {string}             Rendered output.
     */
    // run(tpl, locals, filepath) {
    //     var context = this.getLocals({ locals: locals });
    //     if (filepath) {
    //         this.cacheSet(filepath, {}, tpl);
    //     }
    //     return tpl(self, context, this.filters, utils, efn);
    // };
}

defaultInstance = new Swig();

export default {
    swig: defaultInstance,
    setDefaults: setDefaults,
    setDefaultTZOffset: setDefaultTZOffset
}
