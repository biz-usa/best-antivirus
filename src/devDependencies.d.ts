

/// <reference types="node" />

declare module 'dompurify' {
  const createDOMPurify: (window?: Window | JSDOM) => DOMPurifyI;
  export = createDOMPurify;
}

declare module 'xlsx' {
    const content: any;
    export = content;
}

declare module 'crypto-js' {
    const content: any;
    export = content;
}
