process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import {expect} from "chai";
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
    getHistory(): any[];
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

    getHistory() {
        return this.store;
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
            stringSetAttribute: ["abc"],
            numberSetAttribute: [123,456],
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
            numberListValue: [1234,56742],
            numVal: 246446,
            stringListValue: ["losst1", "liost2"],
        };
        const putItem = await entity.put(data).go();
        const item = await entity.get({stringVal, stringVal2}).go();
        expect(item).to.deep.equal(putItem);
    });

    it("should apply all defaults", async () => {
        const helper = new EntityHelper();
        const entity = getEntity(helper);
        const created = await entity.put({}).go();
        expect(created).to.deep.equal({
            "stringVal": "abc",
            "stringVal2": "abc",
            "enumVal": "abc",
            "numVal": 123,
            "boolValue": true,
            "numberListValue": [],
            "stringListValue": [],
            "mapValue": {}
        })
    });

    it("should apply defaults only to a list and not the items in a list if a list is not supplied", async () => {
        const stringVal = uuid();
        const stringVal2 = uuid();
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                    default: () => stringVal
                },
                stringVal2: {
                    type: "string",
                    default: () => stringVal2
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
                                    return undefined
                                },
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
                                validate: (value) => {
                                    return undefined
                                },
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
                                validate: (value) => {
                                    return undefined
                                },
                                get: (value) => {
                                    return value;
                                },
                                set: (value) => {
                                    return value;
                                }
                            },
                            enumVal: {
                                type: ["abc", "def"] as const,
                                validate: (value: "abc" | "def") => undefined,
                                default: () => "abc",
                                get: (value: "abc" | "def") => {
                                    return value;
                                },
                                set: (value?: "abc" | "def") => {
                                    return value;
                                }
                            },
                        },
                        validate: (value) => {
                            return undefined
                        },
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
        const created = await entity.put({}).go();
        expect(created).to.deep.equal({stringVal, stringVal2});
    });

    it("show allow for empty lists to be added by the user", async () => {
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                },
                stringVal2: {
                    type: "string",
                },
                list: {
                    type: "list",
                    items: {
                        type: "string"
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
        const stringVal = uuid();
        const stringVal2 = uuid();
        const params = entity.put({stringVal, stringVal2, list: []}).params();
        expect(params).to.deep.equal({
            Item: {
                stringVal,
                stringVal2,
                list: [],
                pk: `$versioncontrol#stringval_${stringVal}`,
                sk: `$overview#user_1#stringval2_${stringVal2}`,
                __edb_e__: 'user',
                __edb_v__: '1'
            },
            TableName: 'electro'
        });
        const putItem = await entity.put({stringVal, stringVal2, list: []}).go();
        const getItem = await entity.get({stringVal, stringVal2}).go();
        expect(putItem).to.deep.equal(getItem);
        expect(putItem).to.deep.equal({ stringVal, stringVal2, list: [] });
    });

    it("show allow for empty lists to be added via default", async () => {
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                },
                stringVal2: {
                    type: "string",
                },
                list: {
                    type: "list",
                    items: {
                        type: "string"
                    },
                    default: []
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
        const stringVal = uuid();
        const stringVal2 = uuid();
        const params = entity.put({stringVal, stringVal2, list: []}).params();
        expect(params).to.deep.equal({
            Item: {
                stringVal,
                stringVal2,
                list: [],
                pk: `$versioncontrol#stringval_${stringVal}`,
                sk: `$overview#user_1#stringval2_${stringVal2}`,
                __edb_e__: 'user',
                __edb_v__: '1'
            },
            TableName: 'electro'
        });
        const putItem = await entity.put({stringVal, stringVal2}).go();
        const getItem = await entity.get({stringVal, stringVal2}).go();
        expect(putItem).to.deep.equal(getItem);
        expect(putItem).to.deep.equal({ stringVal, stringVal2, list: [] });
    });

    it("show allow for empty lists to be added via setter", async () => {
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                },
                stringVal2: {
                    type: "string",
                },
                list: {
                    type: "list",
                    items: {
                        type: "string"
                    },
                    set: (value?: string[]) => {
                        if (value) {
                            return value;
                        } else {
                            return [];
                        }
                    },
                },
                otherString: {
                    type: "string",
                    set: (value) => {
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
        const stringVal = uuid();
        const stringVal2 = uuid();
        const params = entity.put({stringVal, stringVal2}).params();
        expect(params).to.deep.equal({
            Item: {
                stringVal,
                stringVal2,
                list: [],
                pk: `$versioncontrol#stringval_${stringVal}`,
                sk: `$overview#user_1#stringval2_${stringVal2}`,
                __edb_e__: 'user',
                __edb_v__: '1'
            },
            TableName: 'electro'
        });
        const putItem = await entity.put({stringVal, stringVal2}).go();
        const getItem = await entity.get({stringVal, stringVal2}).go();
        expect(putItem).to.deep.equal(getItem);
        expect(putItem).to.deep.equal({ stringVal, stringVal2, list: [] });
    });

    it("show allow for empty maps to be added by the user", async () => {
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                },
                stringVal2: {
                    type: "string",
                },
                map: {
                    type: "map",
                    properties: {
                        test: {
                            type: "string"
                        }
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
        const stringVal = uuid();
        const stringVal2 = uuid();
        const params = entity.put({stringVal, stringVal2, map: {}}).params();
        expect(params).to.deep.equal({
            Item: {
                stringVal,
                stringVal2,
                map: {},
                pk: `$versioncontrol#stringval_${stringVal}`,
                sk: `$overview#user_1#stringval2_${stringVal2}`,
                __edb_e__: 'user',
                __edb_v__: '1'
            },
            TableName: 'electro'
        });
        const putItem = await entity.put({stringVal, stringVal2, map: {}}).go();
        const getItem = await entity.get({stringVal, stringVal2}).go();
        expect(putItem).to.deep.equal(getItem);
        expect(putItem).to.deep.equal({ stringVal, stringVal2, map: {} });
    });

    it("show allow for empty maps to be added via default", async () => {
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                },
                stringVal2: {
                    type: "string",
                },
                map: {
                    type: "map",
                    properties: {
                        test: {
                            type: "string"
                        }
                    },
                    default: {}
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
        const stringVal = uuid();
        const stringVal2 = uuid();
        const params = entity.put({stringVal, stringVal2}).params();
        expect(params).to.deep.equal({
            Item: {
                stringVal,
                stringVal2,
                map: {},
                pk: `$versioncontrol#stringval_${stringVal}`,
                sk: `$overview#user_1#stringval2_${stringVal2}`,
                __edb_e__: 'user',
                __edb_v__: '1'
            },
            TableName: 'electro'
        });
        const putItem = await entity.put({stringVal, stringVal2}).go();
        const getItem = await entity.get({stringVal, stringVal2}).go();
        expect(putItem).to.deep.equal(getItem);
        expect(putItem).to.deep.equal({ stringVal, stringVal2, map: {} });
    });

    it("show allow for empty maps to be added via default", async () => {
        const entity = new Entity({
            model: {
                entity: "user",
                service: "versioncontrol",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                },
                stringVal2: {
                    type: "string",
                },
                map: {
                    type: "map",
                    properties: {
                        test: {
                            type: "string"
                        }
                    },
                    set: (value) => {
                        if (value) {
                            return value;
                        } else {
                            return {};
                        }
                    },
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
        const stringVal = uuid();
        const stringVal2 = uuid();
        const params = entity.put({stringVal, stringVal2}).params();
        expect(params).to.deep.equal({
            Item: {
                stringVal,
                stringVal2,
                map: {},
                pk: `$versioncontrol#stringval_${stringVal}`,
                sk: `$overview#user_1#stringval2_${stringVal2}`,
                __edb_e__: 'user',
                __edb_v__: '1'
            },
            TableName: 'electro'
        });
        const putItem = await entity.put({stringVal, stringVal2}).go();
        const getItem = await entity.get({stringVal, stringVal2}).go();
        expect(putItem).to.deep.equal(getItem);
        expect(putItem).to.deep.equal({ stringVal, stringVal2, map: {} });
    });
});