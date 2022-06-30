type ElectroDBMethodTypes = "put" | "get" | "query" | "scan" | "update" | "delete" | "remove" | "patch" | "create" | "batchGet" | "batchWrite";

interface ElectroQueryEvent<P extends any = any> {
    type: 'query';
    method: ElectroDBMethodTypes;
    config: any;
    params: P;
}

interface ElectroResultsEvent<R extends any = any> {
    type: 'results';
    method: ElectroDBMethodTypes;
    config: any;
    results: R;
    success: boolean;
}

type ElectroEvent = 
    ElectroQueryEvent
    | ElectroResultsEvent;

type ElectroEventType = Pick<ElectroEvent, 'type'>;

export type ElectroEventListener = (event: ElectroEvent) => void;

// todo: coming soon, more events!
// | {
//     name: "error";
//     type: "configuration_error" | "invalid_query" | "dynamodb_client";
//     message: string;
//     details: ElectroError;
// } | {
//     name: "error";
//     type: "user_defined";
//     message: string;
//     details: ElectroValidationError;
// } | {
//     name: "warn";
//     type: "deprecation_warning" | "optimization_suggestion";
//     message: string;
//     details: any;
// } | {
//     name: "info";
//     type: "client_updated" | "table_overwritten";
//     message: string;
//     details: any;
// };