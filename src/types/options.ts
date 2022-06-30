import { ElectroEventListener } from './events';

export type ReturnValues = "default" | "none" | 'all_old' | 'updated_old' | 'all_new' | 'updated_new';

export interface QueryOptions {
    raw?: boolean;
    table?: string;
    limit?: number;
    params?: object;
    includeKeys?: boolean;
    originalErr?: boolean;
    ignoreOwnership?: boolean;
    pages?: number;
    listeners?: Array<ElectroEventListener>;
    logger?: ElectroEventListener;
}

// subset of QueryOptions
export interface ParseOptions {
    ignoreOwnership?: boolean;
}

export interface UpdateQueryOptions extends QueryOptions {
    response?: "default" | "none" | 'all_old' | 'updated_old' | 'all_new' | 'updated_new';
}

export interface UpdateQueryParams {
    response?: "default" | "none" | 'all_old' | 'updated_old' | 'all_new' | 'updated_new';
    table?: string;
    params?: object;
    originalErr?: boolean;
}

export interface DeleteQueryOptions extends QueryOptions {
    response?: "default" | "none" | 'all_old';
}

export interface PutQueryOptions extends QueryOptions {
    response?: "default" | "none" | 'all_old';
}

export interface ParamOptions {
    params?: object;
    table?: string;
    limit?: number;
    response?: "default" | "none" | 'all_old' | 'updated_old' | 'all_new' | 'updated_new';
}

export interface PaginationOptions extends QueryOptions {
    pager?: "raw" | "item" | "named";
    limit?: number;
}

export interface BulkOptions extends QueryOptions {
    unprocessed?: "raw" | "item";
    concurrency?: number;
    preserveBatchOrder?: boolean;
}

export type OptionalDefaultEntityIdentifiers = {
    __edb_e__?: string;
    __edb_v__?: string;
}

export type GoRecord<ResponseType, Options = QueryOptions> = <T = ResponseType>(options?: Options) => Promise<T>;

export type BatchGoRecord<ResponseType, AlternateResponseType> = <O extends BulkOptions>(options?: O) =>
    O extends infer Options
        ? 'preserveBatchOrder' extends keyof Options
        ? Options['preserveBatchOrder'] extends true
            ? Promise<AlternateResponseType>
            : Promise<ResponseType>
        : Promise<ResponseType>
        : never

export type PageRecord<ResponseType, CompositeAttributes> = (page?: (CompositeAttributes & OptionalDefaultEntityIdentifiers) | null, options?: PaginationOptions) => Promise<[
    (CompositeAttributes & OptionalDefaultEntityIdentifiers) | null,
    ResponseType
]>;

export type ParamRecord<Options = ParamOptions> = <P>(options?: Options) => P;