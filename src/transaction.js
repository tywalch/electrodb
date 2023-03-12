const { TableIndex } = require('./types');

function createTransaction(options) {
    const { fn, method, getService } = options;
    const operations = {
        params: (options = {}) => {
            const service = getService();
            const paramItems = fn(service.entities);
            const params = {
                TransactItems: paramItems,
            };

            if (typeof options.token === 'string' && options.token.length) {
                params['ClientRequestToken'] = options.token;
            }
            if (options._returnParamItems) {
                return { params, paramItems };
            }
            return params;
        },
        go: async (options) => {
            const service = getService();
            const driver = Object.values(service.entities)[0];

            if (!driver) {
                throw new Error('At least one entity must exist to perform a transaction');
            }

            const { params, paramItems } = operations.params({
                ...options,
                _returnParamItems: true
            });

            let success = true;
            if (paramItems.length === 0) {
                return {
                    success,
                    data: [],
                }
            }

            const response = await driver.go(method, params, {
                ...options,
                parse: (options, data) => {
                    if (options.raw) {
                        return data;
                    } else if (data.canceled) {
                        // FUCK THIS ENDS UP BEING UNMARSHALLED DATA :( :( :( :(
                        // console.log('canceled', JSON.stringify(data.canceled, null, 4));
                        success = false;
                        return service.cleanseCanceledData(TableIndex, service.entities, data, {
                            ...options,
                            _isTransaction: true,
                            _paramItems: paramItems,
                        });
                    } else if (data.Responses) {
                        return service.cleanseTransactionData(TableIndex, service.entities, {
                            Items: data.Responses.map(response => response.Item)
                        }, {
                            ...options,
                            _isTransaction: true,
                            _paramItems: paramItems,
                        });
                    } else {
                        return new Array(paramItems ? paramItems.length : 0).fill({
                            success: true,
                            item: [],
                        });
                    }
                }
            });

            return {
                ...response,
                success,
            }
        }
    }

    return operations;
}

module.exports = {
    createTransaction,
}