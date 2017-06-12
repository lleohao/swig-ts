/**
 * Resolves <var>to</var> to an absolute path or unique identifier. This is used for building correct, normalized, and absolute paths to a given template.
 * 
 * @export
 * @interface ResloveInterface
 */
export interface ResloveInterface {
    /**
     * @param to    Non-absolute identifier or pathname to a file.
     * @param from  If given, should attempt to find the <var>to</var> path in relation to this given, known path.
     */
    (to: string, from?: string): string;
}

export interface LoadInterface {
    (path: string, callback?: (err: Error | null, data: string) => void): undefined | string;
}

export interface TemplateLoader {
    reslove: ResloveInterface;
    load: LoadInterface;
}