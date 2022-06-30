export type DocumentClientMethod = (parameters: any) => {promise: () => Promise<any>};

export type DocumentClient = {
    get: DocumentClientMethod;
    put: DocumentClientMethod;
    delete: DocumentClientMethod;
    update: DocumentClientMethod;
    batchWrite: DocumentClientMethod;
    batchGet: DocumentClientMethod;
    scan: DocumentClientMethod;
    transactGet: DocumentClientMethod;
    transactWrite: DocumentClientMethod;
} | {
    send: (command: any) => Promise<any>;
}