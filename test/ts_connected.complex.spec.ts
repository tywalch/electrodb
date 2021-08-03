process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, Service } from "../index";
import DynamoDB from "aws-sdk/clients/dynamodb";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const table = "electro";

export const complex = new Entity({
    model: {
        entity: "user",
        service: "versioncontrol",
        version: "1"
    },
    attributes: {
        stringVal: {
            type: "string",
            default: () => "abc",
            validate: (value) => value !== undefined,
            get: (value) => {
                return value;
            },
            set: (value) => {
                return value;
            }
        },
        enumVal: {
            type: ["abc", "def"] as const,
            validate: (value: "abc" | "def") => value !== undefined,
            default: () => "abc",
            get: (value: "abc" | "def") => {
                return value;
            },
            set: (value?: "abc" | "def") => {
                return value;
            }
        },
        numVal: {
            type: "number",
            validate: (value) => value !== undefined,
            default: () => 123,
            get: (value) => {
                return value;
            },
            set: (value) => {
                return value;
            }
        },
        boolValue: {
            type: "boolean",
            validate: (value) => value !== undefined,
            default: () => true,
            get: (value) => {
                return value;
            },
            set: (value) => {
                return value;
            }
        },
        stringSetValue: {
            type: "set",
            items: "string",
            validate: (value) => value !== undefined,
            default: () => ["abc"],
            get: (value) => {
                return value;
            },
            set: (value) => {
                return value;
            }
        },
        numberSetValue: {
            type: "set",
            items: "number",
            validate: (value) => value !== undefined,
            default: () => [1],
            get: (value) => {
                return value;
            },
            set: (value) => {
                return value;
            }
        },
        stringListValue: {
            type: "list",
            items: {
                type: "string",
                default: "abc",
                validate: (value) => value !== undefined,
                get: (value) => {
                    return value;
                },
                set: (value) => {
                    return value;
                }
            },
            default: ["abc"],
            validate: (value: string[]) => value !== undefined,
            get: (value: string[]) => {
                return value;
            },
            set: (value?: string[]) => {
                return value;
            }
        },
        numberListValue: {
            type: "list",
            items: {
                type: "number",
                validate: (value) => value !== undefined,
                default: 0,
                get: (value) => {
                    return value;
                },
                set: (value) => {
                    return value;
                }
            },
            default: [],
            validate: (value: number[]) => value !== undefined,
            get: (value: number[]) => {
                return value;
            },
            set: (value?: number[]) => {
                return value;
            }
        },
        mapListValue: {
            type: "list",
            items: {
                type: "map",
                properties: {
                    stringVal: {
                        type: "string",
                        default: "def",
                        validate: (value) => value !== undefined,
                        get: (value) => {
                            return value;
                        },
                        set: (value) => {
                            return value;
                        }
                    },
                    numVal: {
                        type: "number",
                        default: 5,
                        validate: (value) => value !== undefined,
                        get: (value) => {
                            return value;
                        },
                        set: (value) => {
                            return value;
                        }
                    },
                    boolValue: {
                        type: "boolean",
                        default: false,
                        validate: (value) => value !== undefined,
                        get: (value) => {
                            return value;
                        },
                        set: (value) => {
                            return value;
                        }
                    }
                },
                validate: (value) => value !== undefined,
                default: {
                    stringVal: "abc",
                    numVal: 123,
                    boolValue: false,
                },
                get: (value) => {
                    return value;
                },
                set: (value) => {
                    return value;
                }
            },
            get: (value: any) => {
                return value;
            },
            set: (value: any) => {
                return value;
            }
        },
        mapValue: {
            type: "map",
            properties: {
                stringVal: {
                    type: "string",
                    default: () => "abc",
                    validate: (value) => value !== undefined,
                    get: (value) => {
                        return value;
                    },
                    set: (value) => {
                        return value;
                    }
                },
                numVal: {
                    type: "number",
                    default: () => 10,
                    validate: (value) => value !== undefined,
                    get: (value) => {
                        return value;
                    },
                    set: (value) => {
                        return value;
                    }
                },
                boolValue: {
                    type: "boolean",
                    default: () => false,
                    validate: (value) => value !== undefined,
                    get: (value) => {
                        return value;
                    },
                    set: (value) => {
                        return value;
                    }
                },
                stringListValue: {
                    type: "list",
                    items: {
                        type: "string",
                        default: "abc",
                        validate: (value) => value !== undefined,
                        get: (value) => {
                            return value;
                        },
                        set: (value) => {
                            return value;
                        }
                    },
                    default: [],
                    validate: (value: string[]) => value !== undefined,
                    get: (value: string[]) => {
                        return value;
                    },
                    set: (value?: string[]) => {
                        return value;
                    }
                },
                numberListValue: {
                    type: "list",
                    items: {
                        type: "number",
                        default: () => 100,
                        validate: (value) => value !== undefined,
                        get: (value) => {
                            return value;
                        },
                        set: (value) => {
                            return value;
                        }
                    },
                    default: [123, 123],
                    validate: (value: number[]) => value !== undefined,
                    get: (value: number[]) => {
                        return value;
                    },
                    set: (value?: number[]) => {
                        return value;
                    }
                },
                mapListValue: {
                    type: "list",
                    items: {
                        type: "map",
                        properties: {
                            stringVal: {
                                type: "string",
                                default: "def",
                                validate: (value) => value !== undefined,
                                get: (value) => {
                                    return value;
                                },
                                set: (value) => {
                                    return value;
                                }
                            },
                            numVal: {
                                type: "number",
                                default: 100,
                                validate: (value) => value !== undefined,
                                get: (value) => {
                                    return value;
                                },
                                set: (value) => {
                                    return value;
                                }
                            },
                            boolValue: {
                                type: "boolean",
                                default: () => false,
                                validate: (value) => value !== undefined,
                                get: (value) => {
                                    return value;
                                },
                                set: (value) => {
                                    return value;
                                }
                            },
                            emumValue: {
                                type: ["abc", "def"] as const,
                                default: () => "abc",
                                validate: (value: string) => value !== undefined,
                                get: (value: string) => {
                                    return value;
                                },
                                set: (value?: string) => {
                                    return value;
                                }
                            },
                            stringSetValue: {
                                type: "set",
                                items: "string",
                                default: ["abc"],
                                validate: (value) => value !== undefined,
                                get: (value) => {
                                    return value;
                                },
                                set: (value) => {
                                    return value;
                                }
                            },
                            numberSetValue: {
                                type: "set",
                                items: "number",
                                default: [5],
                                validate: (value) => value !== undefined,
                                get: (value) => {
                                    return value;
                                },
                                set: (value) => {
                                    return value;
                                }
                            },
                        },
                        default: () => ({
                            stringVal: "anx",
                            numVal: 13,
                            boolValue: true,
                            emumValue: "abc",
                            stringSetValue: ["def"],
                            numberSetValue: [10],
                        }),
                        validate: (value) => value !== undefined,
                        get: (value) => {
                            return value;
                        },
                        set: (value) => {
                            return value;
                        }
                    },
                    default: [],
                    validate: (value: Record<string, any>[]) => value !== undefined,
                    get: (value: Record<string, any>[]) => {
                        return value;
                    },
                    set: (value?: Record<string, any>[]) => {
                        return value;
                    }
                },
            },
            default: () => undefined,
            validate: (value) => value !== undefined,
            get: (value) => {
                return value;
            },
            set: (value) => {
                return value;
            }
        }
    },
    indexes: {
        user: {
            collection: "overview",
            pk: {
                composite: ["username"],
                field: "pk"
            },
            sk: {
                composite: [],
                field: "sk"
            }
        },
        _: {
            collection: "owned",
            index: "gsi1pk-gsi1sk-index",
            pk: {
                composite: ["username"],
                field: "gsi1pk"
            },
            sk: {
                field: "gsi1sk",
                composite: []
            }
        }
    }
}, {table, client});
