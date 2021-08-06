process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, Service } from "../index";
import DynamoDB from "aws-sdk/clients/dynamodb";
import {v4 as uuid} from "uuid";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const table = "electro";

interface Helper {
    triggerGetter(...values: any[]): void;
    triggerSetter(...values: any[]): void;
    triggerValidate(...values: any[]): void;
    triggerDefault(...values: any[]): void;
}

function getEntity(helper: Helper) {
    return new Entity({
        model: {
            entity: "user",
            service: "versioncontrol",
            version: "1"
        },
        attributes: {
            stringVal: {
                type: "string",
                default: () => "abc",
                validate: (value) => {
                    helper.triggerValidate(value);
                    return undefined
                },
                get: (value) => {
                    helper.triggerGetter( "stringVal", value);
                    return value;
                },
                set: (value) => {
                    helper.triggerSetter( "stringVal", value);
                    return value;
                }
            },
            stringVal2: {
                type: "string",
                default: () => "abc",
                validate: (value) => {
                    helper.triggerValidate(value);
                    return undefined
                },
                get: (value) => {
                    helper.triggerGetter( "stringVal2", value);
                    return value;
                },
                set: (value) => {
                    helper.triggerSetter( "stringVal2", value);
                    return value;
                }
            },
            enumVal: {
                type: ["abc", "def"] as const,
                validate: (value: "abc" | "def") => undefined,
                default: () => "abc",
                get: (value: "abc" | "def") => {
                    helper.triggerGetter( "enumVal", value);
                    return value;
                },
                set: (value?: "abc" | "def") => {
                    helper.triggerSetter( "enumVal", value);
                    return value;
                }
            },
            numVal: {
                type: "number",
                validate: (value) => {
                    helper.triggerValidate(value);
                    return undefined
                },
                default: () => 123,
                get: (value) => {
                    helper.triggerGetter( "numVal", value);
                    return value;
                },
                set: (value) => {
                    helper.triggerSetter( "numVal", value);
                    return value;
                }
            },
            boolValue: {
                type: "boolean",
                validate: (value) => {
                    helper.triggerValidate(value);
                    return undefined
                },
                default: () => true,
                get: (value) => {
                    helper.triggerGetter( "boolValue", value);
                    return value;
                },
                set: (value) => {
                    helper.triggerSetter( "boolValue", value);
                    return value;
                }
            },
            stringSetAttribute: {
                type: "set",
                items: "string",
                validate: (value) => {
                    helper.triggerValidate(value);
                    return undefined;
                },
                get: (value) => {
                    helper.triggerGetter( "stringSetValue", "items", value);
                    return value;
                },
                set: (value) => {
                    helper.triggerSetter( "stringSetValue", "items", value);
                    return value;
                }
            },
            stringListValue: {
                type: "list",
                items: {
                    type: "string",
                    default: "def",
                    validate: (value) => {
                        helper.triggerValidate(value);
                        return undefined
                    },
                    get: (value) => {
                        helper.triggerGetter( "stringListValue", "items", value);
                        return value;
                    },
                    set: (value) => {
                        helper.triggerSetter( "stringListValue", "items", value);
                        return value;
                    }
                },
                default: () => {
                    return [];
                },
                validate: (value: string[]) => undefined,
                get: (value: string[]) => {
                    helper.triggerGetter( "stringListValue", value);
                    return value;
                },
                set: (value?: string[]) => {
                    helper.triggerSetter( "stringListValue", value);
                    return value;
                }
            },
            numberListValue: {
                type: "list",
                items: {
                    type: "number",
                    validate: (value) => {
                        helper.triggerValidate(value);
                        return undefined
                    },
                    default: 0,
                    get: (value) => {
                        helper.triggerGetter( "numberListValue", value);
                        return value;
                    },
                    set: (value) => {
                        helper.triggerSetter(value);
                        return value;
                    }
                },
                default: [],
                validate: (value: number[]) => undefined,
                get: (value: number[]) => {
                    helper.triggerGetter( "numberListValue", value);
                    return value;
                },
                set: (value?: number[]) => {
                    helper.triggerSetter( "numberListValue", value);
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
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "stringVal", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "stringVal", value);
                                return value;
                            }
                        },
                        numVal: {
                            type: "number",
                            default: 5,
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "numVal", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "numVal", value);
                                return value;
                            }
                        },
                        boolValue: {
                            type: "boolean",
                            default: false,
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "boolValue", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "boolValue", value);
                                return value;
                            }
                        },
                        enumVal: {
                            type: ["abc", "def"] as const,
                            validate: (value: "abc" | "def") => undefined,
                            default: () => "abc",
                            get: (value: "abc" | "def") => {
                                helper.triggerGetter( "enumVal", value);
                                return value;
                            },
                            set: (value?: "abc" | "def") => {
                                helper.triggerSetter( "enumVal", value);
                                return value;
                            }
                        },
                    },
                    validate: (value) => {
                        helper.triggerValidate(value);
                        return undefined
                    },
                    default: {
                        stringVal: "abc",
                        numVal: 123,
                        boolValue: false,
                    },
                    get: (value) => {
                        helper.triggerGetter( "mapListValue", "map", value);
                        return value;
                    },
                    set: (value) => {
                        helper.triggerSetter( "mapListValue", "map", value);
                        return value;
                    }
                },
                get: (value: any) => {
                    helper.triggerGetter( "mapListValue",value);
                    return value;
                },
                set: (value: any) => {
                    helper.triggerSetter( "mapListValue",value);
                    return value;
                }
            },
            mapValue: {
                type: "map",
                properties: {
                    stringVal: {
                        type: "string",
                        default: () => "abc",
                        validate: (value) => {
                            helper.triggerValidate(value);
                            return undefined
                        },
                        get: (value) => {
                            helper.triggerGetter( "stringVal", value);
                            return value;
                        },
                        set: (value) => {
                            helper.triggerSetter( "stringVal", value);
                            return value;
                        }
                    },
                    numVal: {
                        type: "number",
                        default: () => 10,
                        validate: (value) => {
                            helper.triggerValidate(value);
                            return undefined
                        },
                        get: (value) => {
                            helper.triggerGetter( "numVal", value);
                            return value;
                        },
                        set: (value) => {
                            helper.triggerSetter( "numVal", value);
                            return value;
                        }
                    },
                    boolValue: {
                        type: "boolean",
                        default: () => false,
                        validate: (value) => {
                            helper.triggerValidate(value);
                            return undefined
                        },
                        get: (value) => {
                            helper.triggerGetter( "boolValue", value);
                            return value;
                        },
                        set: (value) => {
                            helper.triggerSetter( "boolValue", value);
                            return value;
                        }
                    },
                    enumVal: {
                        type: ["abc", "def"] as const,
                        validate: (value: "abc" | "def") => undefined,
                        default: () => "abc",
                        get: (value: "abc" | "def") => {
                            helper.triggerGetter( "enumVal", value);
                            return value;
                        },
                        set: (value?: "abc" | "def") => {
                            helper.triggerSetter( "enumVal", value);
                            return value;
                        }
                    },
                    stringListValue: {
                        type: "list",
                        items: {
                            type: "string",
                            default: "abc",
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "stringListValue", "string", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "stringListValue", "string", value);
                                return value;
                            }
                        },
                        default: [],
                        validate: (value: string[]) => undefined,
                        get: (value: string[]) => {
                            helper.triggerGetter( "stringListValue", value);
                            return value;
                        },
                        set: (value?: string[]) => {
                            helper.triggerSetter( "stringListValue", value);
                            return value;
                        }
                    },
                    numberListValue: {
                        type: "list",
                        items: {
                            type: "number",
                            default: () => 100,
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "numberListValue", "items", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "numberListValue", "items",  value);
                                return value;
                            }
                        },
                        default: [123, 123],
                        validate: (value: number[]) => undefined,
                        get: (value: number[]) => {
                            helper.triggerGetter( "mapValue", value);
                            return value;
                        },
                        set: (value?: number[]) => {
                            helper.triggerSetter( "mapValue", value);
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
                                    validate: (value) => {
                                        helper.triggerValidate(value);
                                        return undefined
                                    },
                                    get: (value) => {
                                        helper.triggerGetter( "stringVal", value);
                                        return value;
                                    },
                                    set: (value) => {
                                        helper.triggerSetter( "stringVal", value);
                                        return value;
                                    }
                                },
                                numVal: {
                                    type: "number",
                                    default: 100,
                                    validate: (value) => {
                                        helper.triggerValidate(value);
                                        return undefined
                                    },
                                    get: (value) => {
                                        helper.triggerGetter( "numVal", value);
                                        return value;
                                    },
                                    set: (value) => {
                                        helper.triggerSetter( "numVal", value);
                                        return value;
                                    }
                                },
                                boolValue: {
                                    type: "boolean",
                                    default: () => false,
                                    validate: (value) => {
                                        helper.triggerValidate(value);
                                        return undefined
                                    },
                                    get: (value) => {
                                        helper.triggerGetter( "boolValue", value);
                                        return value;
                                    },
                                    set: (value) => {
                                        helper.triggerSetter( "boolValue", value);
                                        return value;
                                    }
                                },
                                enumVal: {
                                    type: ["abc", "def"] as const,
                                    validate: (value: "abc" | "def") => undefined,
                                    default: () => "abc",
                                    get: (value: "abc" | "def") => {
                                        helper.triggerGetter( "enumVal", value);
                                        return value;
                                    },
                                    set: (value?: "abc" | "def") => {
                                        helper.triggerSetter( "enumVal", value);
                                        return value;
                                    }
                                },
                            },
                            default: {},
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "map", "mapListValue", "map", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "map", "mapListValue", "map", value);
                                return value;
                            }
                        },
                        default: [],
                        validate: (value: Record<string, any>[]) => undefined,
                        get: (value: Record<string, any>[]) => {
                            helper.triggerGetter( "map", "mapListValue", value);
                            return value;
                        },
                        set: (value?: Record<string, any>[]) => {
                            helper.triggerSetter( "map", "mapListValue", value);
                            return value;
                        }
                    },
                },
                default: {},
                validate: (value) => {
                    helper.triggerValidate(value);
                    return undefined
                },
                get: (value) => {
                    helper.triggerGetter( "map", value);
                    return value;
                },
                set: (value) => {
                    helper.triggerSetter( "map", value);
                    return value;
                }
            }
        },
        indexes: {
            user: {
                collection: "overview",
                pk: {
                    composite: ["stringVal"],
                    field: "pk"
                },
                sk: {
                    composite: ["stringVal2"],
                    field: "sk"
                }
            },
        }
    }, {table, client});
}

class EntityHelper implements Helper {
    private store: any[] = [];

    triggerSetter(...values: any[]) {
        this.store.push({trigger: "setter", values});
    }

    triggerGetter(...values: any[]) {
        this.store.push({trigger: "getter", values});
    }

    triggerValidate(...values: any) {
        this.store.push({trigger: "validate", values});
    }

    triggerDefault(...values: any) {
        this.store.push({trigger: "default", values});
    }
}


describe("Simple Crud On Complex Entity", () => {
    it("should add and retrieve a record as specified", async () => {
        const helper = new EntityHelper();
        const entity = getEntity(helper);
        const stringVal = uuid();
        const stringVal2 = uuid();
        const data = {
            stringVal,
            stringVal2,
            boolValue: true,
            enumVal: "abc" as const,
            mapListValue: [
                {
                    boolValue: true,
                    numVal: 123,
                    stringVal: "abc",
                    enumVal: "abc" as const
                }
            ],
            mapValue: {
                boolValue: false,
                mapListValue: [{
                    boolValue: true,
                    numVal: 456,
                    stringVal: "def",
                    enumVal: "def" as const
                }],
                numberListValue: [1234, 567],
                numVal: 364,
                stringListValue: ["item1", "item2", "item2"],
                stringVal: "mystring",
                enumVal: "def" as const
            },
            // numberListValue: [1234,56742] as const,
            numVal: 246446,
            // stringListValue: ["losst1", "liost2"],
        };
        const putParams: any = entity.put(data).params();
        // console.log("%o", putParams);
        // console.log("%o", putParams.Item.mapValue.mapListValue[0]);
        // const put = await entity.put({
        //     stringVal,
        //     stringVal2,
        //     boolValue: true,
        //     // todo: mapValue all are required?
        //     enumVal: "abc",
        //     mapListValue: [
        //         {
        //             boolValue: true,
        //             numVal: 123,
        //             stringVal: "abc"
        //         }
        //     ],
        //     mapValue: {
        //         boolValue: false,
        //         mapListValue: [{
        //             boolValue: true,
        //             numVal: 456,
        //             stringVal: "def",
        //             emumValue: "def",
        //         }],
        //         numberListValue: [1234, 567],
        //         numVal: 364,
        //         stringListValue: ["item1", "item2", "item2"],
        //         stringVal: "mystring"
        //     },
        //     numberListValue: [1234,56742],
        //     numVal: 246446,
        //     stringListValue: ["list", "list"],
        // }).go();
        // console.log(JSON.stringify({put}, null, 2));
        // const get = await entity.get({stringVal, stringVal2}).go();
        // console.log(JSON.stringify({get}, null, 2));
    });

    it("should apply all defaults", async () => {
        const helper = new EntityHelper();
        const entity = getEntity(helper);
        const created = await entity.put({}).go();
        console.log(JSON.stringify({created}, null, 2))
    })

    it("should add defaults to map attributes", async () => {
        const helper = new EntityHelper();
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                id1: {
                    type: "string",
                    default: () => "abc",
                    validate: (value) => {
                        helper.triggerValidate(value);
                        return undefined
                    },
                    get: (value) => {
                        helper.triggerGetter("id1", value);
                        return value;
                    },
                    set: (value) => {
                        helper.triggerSetter("id1", value);
                        return value;
                    }
                },
                id2: {
                    type: "string",
                    default: () => "abc",
                    validate: (value) => {
                        helper.triggerValidate(value);
                        return undefined
                    },
                    get: (value) => {
                        helper.triggerGetter("id2", value);
                        return value;
                    },
                    set: (value) => {
                        helper.triggerSetter("id2", value);
                        return value;
                    }
                },
                mapVal: {
                    type: "map",
                    properties: {
                        stringVal: {
                            type: "string",
                            default: () => {
                                helper.triggerDefault("stringVal", "def");
                                return "def";
                            },
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "stringVal", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "stringVal", value);
                                return value;
                            }
                        },
                        numVal: {
                            type: "number",
                            default: () => {
                                helper.triggerDefault("numVal", 5);
                                return 5;
                            },
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "numVal", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "numVal", value);
                                return value;
                            }
                        },
                        boolValue: {
                            type: "boolean",
                            default: () => {
                                helper.triggerDefault("boolValue", false);
                                return false
                            },
                            validate: (value) => {
                                helper.triggerValidate(value);
                                return undefined
                            },
                            get: (value) => {
                                helper.triggerGetter( "boolValue", value);
                                return value;
                            },
                            set: (value) => {
                                helper.triggerSetter( "boolValue", value);
                                return value;
                            }
                        },
                        enumVal: {
                            type: ["abc", "def"] as const,
                            validate: (value: "abc" | "def") => undefined,
                            default: () => {
                                helper.triggerDefault("enumVal", "abc");
                                return "abc";
                            },
                            get: (value: "abc" | "def") => {
                                helper.triggerGetter( "enumVal", value);
                                return value;
                            },
                            set: (value?: "abc" | "def") => {
                                helper.triggerSetter( "enumVal", value);
                                return value;
                            }
                        },
                    },
                    validate: (value) => {
                        helper.triggerValidate(value);
                        return undefined
                    },
                    default: () => {
                        helper.triggerDefault("stringVal", {
                            stringVal: "abc",
                            numVal: 123,
                            boolValue: false,
                        });
                        return {
                            stringVal: "abc",
                            numVal: 123,
                            boolValue: false,
                        }
                    },
                    get: (value) => {
                        helper.triggerGetter( "mapListValue", "map", value);
                        return value;
                    },
                    set: (value) => {
                        helper.triggerSetter( "mapListValue", "map", value);
                        return value;
                    }
                }
            },
            indexes: {
                user: {
                    collection: "overview",
                    pk: {
                        composite: ["id1"],
                        field: "pk"
                    },
                    sk: {
                        composite: ["id2"],
                        field: "sk"
                    }
                },
            }
        }, {table, client});

        const item = {
            id1: uuid(),
            id2: uuid(),
            // mapVal: {
            //     enumVal: "def" as const,
            //     numVal: 183,
            //     boolValue: true,
            //     stringVal: "ohmugush"
            // }
        }
        const created = await entity.put(item).go();
        console.log("created", JSON.stringify(created, null, 2));
        // console.log(JSON.stringify(helper, null, 2));
        const results = await entity.get(item).go();
        console.log("results", JSON.stringify(results, null, 2));
        // console.log(JSON.stringify(helper, null, 2));
    })
});