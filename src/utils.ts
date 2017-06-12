/**
 * Throw an error with possiable line number and source file.
 * @param message Error message
 * @param line Line number in template.
 * @param file Template file the error occured in.
 * @throws No seriously, the point is to throw an error.
 */
export const throwError = function (message: string, line?: string | number, file?: string): Error {
    if (line) {
        message += ' on line ' + line;
    }

    if (file) {
        message += ' in file ' + file;
    }

    throw new Error(message + '.');
}