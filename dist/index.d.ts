declare const plugin: {
    languages: {
        name: string;
        parsers: string[];
        extensions: string[];
    }[];
    parsers: {
        devalang: {
            parse: (text: string) => import("./interfaces/statement").ProgramNode;
            astFormat: string;
        };
    };
    printers: {
        devalang: {
            print: (path: import("prettier").AstPath<import("./types/node").Node>, options: any, print: (path: import("prettier").AstPath<import("./types/node").Node>) => import("prettier").Doc) => import("prettier").Doc;
        };
    };
    astFormat: string;
};
export = plugin;
