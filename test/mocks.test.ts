import { Entity, EntityConfiguration, ElectroEventListener, ElectroEvent } from '../index';

interface LogCollector {
    get(): ElectroEvent[];
    reset(): ElectroEvent[];
    listener: ElectroEventListener;
}

function createLogCollector(): LogCollector {
    let logs: ElectroEvent[] = [];
    return {
        listener: (event) => {
            logs.push(event);
        },
        get: () => logs,
        reset: () => {
            const previous = [...logs];
            logs = [];
            return previous;
        }
    }
}

export function createStringEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'string'
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createNumberEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'number'
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createBooleanEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'boolean'
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createStringListEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'list',
                items: {
                    type: 'string'
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createNumberListEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'list',
                items: {
                    type: 'number'
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createMapListEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'list',
                items: {
                    type: 'map',
                    properties: {
                        val: {
                            type: 'string'
                        }
                    }
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createStringMapEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'map',
                properties: {
                    val: {
                        type: 'string'
                    }
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createNumberMapEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'map',
                properties: {
                    val: {
                        type: 'number'
                    }
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createBooleanMapEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'map',
                properties: {
                    val: {
                        type: 'boolean'
                    }
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createListMapEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'map',
                properties: {
                    val: {
                        type: 'list',
                        items: {
                            type: 'string'
                        }
                    }
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createSetMapEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'map',
                properties: {
                    val: {
                        type: 'set',
                        items: 'string'
                    }
                }
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createStringSetEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'set',
                items: 'string'
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createNumberSetEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'set',
                items: 'number'
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createAnyEntity(config: EntityConfiguration) {
    const logCollector = createLogCollector();
    const entity = new Entity({
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            name: {
                type: "string",
            },
            type: {
                type: 'string'
            },
            prop: {
                type: 'any',
            }
        },
        indexes: {
            records: {
                pk: {
                    field: "pk",
                    composite: ["type"],
                },
                sk: {
                    field: "sk",
                    composite: ["name"],
                },
            },
        },
    }, {
        ...config,
        listeners: [...(config?.listeners ?? []), logCollector.listener]
    });

    return {
        entity,
        logCollector,
    }
}

export function createAttributeEntities(config: EntityConfiguration) {
    return {
        stringEntity: createStringEntity(config),
        numberEntity: createNumberEntity(config),
        booleanEntity: createBooleanEntity(config),
        stringListEntity: createStringListEntity(config),
        numberListEntity: createNumberListEntity(config),
        mapListEntity: createMapListEntity(config),
        stringMapEntity: createStringMapEntity(config),
        numberMapEntity: createNumberMapEntity(config),
        booleanMapEntity: createBooleanMapEntity(config),
        listMapEntity: createListMapEntity(config),
        setMapEntity: createSetMapEntity(config),
        stringSetEntity: createStringSetEntity(config),
        numberSetEntity: createNumberSetEntity(config),
        anyEntity: createAnyEntity(config)
    }
}