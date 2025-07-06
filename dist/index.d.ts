import * as parser from "./parser";
declare const plugin: {
    languages: {
        name: string;
        parsers: string[];
        extensions: string[];
    }[];
    parsers: {
        devalang: {
            parse: (text: string) => parser.ProgramNode;
            astFormat: string;
        };
    };
    printers: {
        devalang: {
            print: (path: import("prettier").AstPath<parser.Node>, options: any, print: (path: import("prettier").AstPath<parser.Node>) => import("prettier").Doc) => import("prettier").Doc;
        };
    };
    astFormat: string;
};
export = plugin;
