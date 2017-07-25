import utils from './utils';
import filters, { Filters } from './filters';
import tags, { Tags, CompileFunction, ParseFunction } from './tags';
import { fs, TemplateLoader } from './loaders';
import dateformatter from './dateformat';
import parser, { ParsedToken } from './parser';
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
     * @default true
     */
    autoescape?: boolean;
    /**
     * Open and close controls for variables.
     * 
     * @default ['{{', '}}']
     */
    varControls?: [string, string];
    /**
     * Open and close controls for tags.
     * 
     * @default ['{%', '%}']
     */
    tagControls?: [string, string];
    /**
     * Open and close controls for comments.
     * 
     * @default ['{#', '#}']
     */
    cmtControls?: [string, string];
    /**
     * Default variable context to be passed to <strong>all</strong> templates.
     * 
     */
    locals?: {};
    /**
     * Cache control for templates. Send false to disable. Send an object with get and set functions to customize.
     * 
     * @default true
     */
    cache?: boolean | CacheOptions;
    /**
     * The method that Swig will use to load templates. Defaults to swig.loaders.fs.
     * 
     */
    loader?: TemplateLoader;
    /**
     * Resolve path
     * 
     */
    resolveFrom?: string;
    /**
     * Template file name. Don't send any value to this property.
     * 
     */
    filename?: string;
    /**
     * Template file root path.
     * 
     * @default ""
     */
    templates?: string;
}

const defaultOptions: SwigOptions = {
    autoescape: true,
    varControls: ['{{', '}}'],
    tagControls: ['{%', '%}'],
    cmtControls: ['{#', '#}'],
    locals: {},
    /**
     * Cache control for templates. Defaults to saving all templates into memory.
     * 
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
     * Configure Swig to use either the `swig.loaders.fs` or `swig.loaders.memory` template loader. 
     * Or, you can write your own!
     * 
     * @example
     * FIXME: 想个更好的方式定义loader
     * // Memory Loader
     * swig.setDefaults({ loader: swig.loaders.memory({
     *   layout: '{% block foo %}{% endblock %}',
     *   page1: '{% extends "layout" %}{% block foo %}Tacos!{% endblock %}'
     * })}); 
     */
    loader: undefined,
    /*
     * Set fileSystem loader allowing a base path.
     * 
     * @example
     * // FileSystem loader allowing a base path
     * // With this, you don't use relative URLs in your template references
     * swig.setDefaults({ templates: __dirname + '/templates' });
     */
    templates: ''
};

/**
 * Empty function, used in templates.
 * @return {string} Empty string
 * @private
 */
function efn() { return '' }

/**
 * Valiadte options.
 * 
 * @param {SwigOptions} options 
 */
function validateOptions(options: SwigOptions) {
    ['varControls', 'tagControls', 'cmtControls'].forEach((key) => {
        if (!options.hasOwnProperty(key)) {
            return;
        }
        const value = options[key];

        if (value[0] === value[1]) {
            throw new Error(`Options "${key}" open and close controls must not be the same.`);
        }

        (value as string[]).forEach((value, index) => {
            if (value.length < 2) {
                throw new Error(`Optiosn "${key}" ${(index === 0) ? 'open ' : 'close'} control must be at least 2 characters. Saw "${value}" instead.`);
            }
        })
    });
}

/**
 * Set the default TimeZone offset for date formatting via the date filter. This is a global setting and will affect all Swig environments, old or new.
 * @param  {number} offset Offset from GMT, in minutes.
 * @return {undefined}
 */
const setDefaultTZOffset = function (offset) {
    dateformatter.tzOffset = offset;
};

/**
 * Create a new Swig compile/render environment.
 * 
 * @example
 * import { Swig } from 'swig-ts';
 * const swig = new Swig({ varControls: ['<%=', '%>'] })
 * swig.render('Tacos are <%= tacos =>!', { locals: { tacos: 'delicious' }});
 * // => Tacos are delicious!
 * swig.render('Tacos are <%= tacos =>!', { locals: { tacos: 'delicious' }});
 * // => 'Tacos are <%= tacos =>!'
 *  
 * @export
 * @class Swig
 */
export class Swig {
    private options: SwigOptions;
    private cache: { [key: string]: TemplateCompiled };
    private extensions: {};
    private filters: Filters;
    private tags: Tags;

    /**
     * Creates an instance of Swig.
     * 
     * @param [opts]
     */
    constructor(opts: SwigOptions = {}) {
        validateOptions(opts);
        this.options = utils.extend({}, defaultOptions, opts);
        if (this.options.loader === undefined) {
            this.options.loader = fs(this.options.templates);
        }
        this.cache = {};
        this.extensions = {};
        this.filters = filters;
        this.tags = tags;
    }

    /**
     * Determine whether caching is enabled via the options provided and/or default.
     * 
     * @private
     * @param [options={}] 
     * @returns {boolean}
     */
    private shouldCache(options: SwigOptions = {}): boolean {
        return (options.hasOwnProperty('cache') && !options.cache) || !this.options.cache;
    }

    /**
     * Get compield template from the cache.
     * 
     * @private
     * @param key       Name of template.
     * @param options   Template function and tokens.
     * @returns {TemplateCompiled}
     */
    private cacheGet(key: string, options?: SwigOptions): TemplateCompiled {
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
     * @param key              Name of template.
     * @param options          Template function and tokens.
     * @param val              Template function and tokens.
     * @returns {void}
     */
    private cacheSet(key: string, options: SwigOptions, val: TemplateCompiled): void {
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
     */
    public invalidateCache(): void {
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
     * @param name      Name of filter, used in templates. Will overwrite previously defined filters, if using same name.
     * @param method    Function that acts against the input.
     */
    public setFilter(name: string, method: (input: string) => string): void {
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
     * @param name                  Tag name. 
     * @param parse                 Method for parsing tokens.
     * @param compile               Method for compiling renderable output.
     * @param [ends=false]          Whether or no this tag requires an end tag.
     * @param [blockLevel=false]    If false, this tag will not be compiled outside of block tag when extending a parent template.
     */
    public setTag(
        name: string,
        parse: ParseFunction,
        compile: CompileFunction,
        ends: boolean = false,
        blockLevel: boolean = false) {
        this.tags[name] = {
            parse: parse,
            compile: compile,
            ends: ends,
            block: blockLevel
        }
    }

    /**
     * Add extensions for custom tags. 
     * This allows any custom tag to access a globally available methods via a special globally available object, _ext, in templates.
     *
     * @example
     * swig.setExtension('trans', function (v) { return translate(v); });
     * function compileTrans(compiler, args, content, parent, options) {
     *   return '_output += _ext.trans(' + args[0] + ');'
     * };
     * swig.setTag('trans', parseTrans, compileTrans, true);
     *
     * @param  name   Key name of the extension. Accessed via <code data-language="js">_ext[name]</code>.
     * @param  object The method, value, or object that should be available via the given name.
     */
    public setExtension(name: string, object: (value: any) => string): void {
        this.extensions[name] = object;
    };

    /**
     * Get combined locals context.
     * 
     * @private
     * @param [options] 
     * @returns {object}
     */
    private getLocals(options: SwigOptions = {}): object {
        if (!options.locals) {
            return this.options.locals;
        }

        return utils.extend({}, this.options.locals, options.locals);
    }

    /**
     * Parse a given source string into tokens.
     * 
     * @param source          Swig template source.
     * @param [options={}]    Swig options object.
     * @return {ParsedToken}
     * @private
     */
    private parse(source: string, options: SwigOptions = {}): ParsedToken {
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
     * @param pathname          Full path to file to parse.
     * @param [options={}]      Swig options object.
     */
    public parseFile(pathname: string, options: SwigOptions = {}): ParsedToken {
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
    private remapBlocks(blocks: {}, tokens: ParsedToken): LexerToken[] {
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
     * @param tokens          Parsed tokens from templates.
     * @param [options={}]    Swign options object.
     * @return {any[]}       Parsed tokens from templates.
     */
    private getParents(tokens, options: SwigOptions = {}): any[] {
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
     * @param source    Swig template string.
     * @param options   Swig options.
     */
    private preCompile(source: string, options: SwigOptions): { tpl: Function, tokens: ParsedToken } {
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
    public render(source: string, options: SwigOptions = {}) {
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
     * @param  pathName     File location.
     * @param  [locals={}]  Template variable context.
     * @param  [cb]         Asyncronous callback function. If not provided, <var>compileFile will run syncronously.
     * @return {string}
     */
    public renderFile(pathName: string, locals: {} = {}, cb?) {
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
     * When compiling a source string, a file path should be specified in the options object in order for <var>extends, <var>include, and <var>import to work properly. Do this by adding <code data-language="js">{ filename: '/absolute/path/to/mytpl.html' }</code> to the options argument.
     *
     * @param  source      Swig template source string.
     * @param  options     Swig options.
     * @return {function}                   Renderable function with keys for parent, blocks, and tokens.
     */
    public compile(source: string, options: SwigOptions = {}): TemplateCompiled {
        let key = options ? options.filename : null,
            cached = key ? this.cacheGet(key, options) : null,
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

    /**
     * Compile file into a renderable template function.
     * 
     * @param   pathname 
     * @param   [options={}] 
     * @param   [cb] 
     * @returns {Function} 
     */
    public compileFile(pathname: string, options: SwigOptions = {}, cb?: Function): Function {
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
}

export default {
    setDefaultTZOffset
}
