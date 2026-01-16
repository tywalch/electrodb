const lib = require("@aws-sdk/lib-dynamodb");
const util = require("@aws-sdk/util-dynamodb");
const { isFunction } = require("./validations");
const { ElectroError, ErrorCodes } = require("./errors");
const DocumentClientVersions = {
  v2: "v2",
  v3: "v3",
  electro: "electro",
};
const unmarshallItem = (value) => {
  const unmarshall = util.unmarshall || ((val) => val);
  try {
    value.Item = unmarshall(value.Item);
  } catch (err) {
    console.error("Internal Error: Failed to unmarshal input", err);
  }

  return value;
};

const v3Methods = ["send"];
const v2Methods = [
  "get",
  "put",
  "update",
  "delete",
  "batchWrite",
  "batchGet",
  "scan",
  "query",
  "createSet",
  "transactWrite",
  "transactGet",
];
const supportedClientVersions = {
  [DocumentClientVersions.v2]: v2Methods,
  [DocumentClientVersions.v3]: v3Methods,
};

class DocumentClientV2Wrapper {
  static init(client) {
    return new DocumentClientV2Wrapper(client, lib);
  }

  constructor(client, lib) {
    this.client = client;
    this.lib = lib;
    this.__v = "v2";
  }

  _wrapRequest(request, signal) {
    return {
      promise: () => {
        return new Promise((resolve, reject) => {
          if (signal && signal.aborted) {
            request.abort();
            return reject(
              new ElectroError(
                ErrorCodes.OperationAborted,
                "The operation was aborted",
              ),
            );
          }

          const onAbort = () => {
            request.abort();
            reject(
              new ElectroError(
                ErrorCodes.OperationAborted,
                "The operation was aborted",
              ),
            );
          };

          if (signal) {
            signal.addEventListener("abort", onAbort, { once: true });
          }

          request
            .promise()
            .then((result) => {
              if (signal) {
                signal.removeEventListener("abort", onAbort);
              }
              resolve(result);
            })
            .catch((err) => {
              if (signal) {
                signal.removeEventListener("abort", onAbort);
              }
              reject(err);
            });
        });
      },
    };
  }

  get(params, options = {}) {
    const request = this.client.get(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  put(params, options = {}) {
    const request = this.client.put(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  update(params, options = {}) {
    const request = this.client.update(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  delete(params, options = {}) {
    const request = this.client.delete(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  batchWrite(params, options = {}) {
    const request = this.client.batchWrite(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  batchGet(params, options = {}) {
    const request = this.client.batchGet(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  scan(params, options = {}) {
    const request = this.client.scan(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  query(params, options = {}) {
    const request = this.client.query(params);
    return this._wrapRequest(request, options.abortSignal);
  }

  _transact(transactionRequest, signal) {
    let cancellationReasons;
    transactionRequest.on("extractError", (response) => {
      try {
        cancellationReasons = JSON.parse(
          response.httpResponse.body.toString(),
        ).CancellationReasons;
      } catch (err) {}
    });

    return {
      promise: () => {
        return new Promise((resolve, reject) => {
          if (signal && signal.aborted) {
            transactionRequest.abort();
            return reject(
              new ElectroError(
                ErrorCodes.OperationAborted,
                "The operation was aborted",
              ),
            );
          }

          const onAbort = () => {
            transactionRequest.abort();
            reject(
              new ElectroError(
                ErrorCodes.OperationAborted,
                "The operation was aborted",
              ),
            );
          };

          if (signal) {
            signal.addEventListener("abort", onAbort, { once: true });
          }

          transactionRequest
            .promise()
            .then((result) => {
              if (signal) {
                signal.removeEventListener("abort", onAbort);
              }
              resolve(result);
            })
            .catch((err) => {
              if (signal) {
                signal.removeEventListener("abort", onAbort);
              }
              if (err) {
                if (Array.isArray(cancellationReasons)) {
                  resolve({
                    canceled: cancellationReasons.map((reason) => {
                      if (reason.Item) {
                        return unmarshallItem(reason);
                      }
                      return reason;
                    }),
                  });
                } else {
                  reject(err);
                }
              }
            });
        });
      },
    };
  }

  transactWrite(params, options = {}) {
    const transactionRequest = this.client.transactWrite(params);
    return this._transact(transactionRequest, options.abortSignal);
  }

  transactGet(params, options = {}) {
    const transactionRequest = this.client.transactGet(params);
    return this._transact(transactionRequest, options.abortSignal);
  }

  createSet(value, ...rest) {
    if (Array.isArray(value)) {
      return this.client.createSet(value, ...rest);
    } else {
      return this.client.createSet([value], ...rest);
    }
  }
}

class DocumentClientV3Wrapper {
  static init(client) {
    return new DocumentClientV3Wrapper(client, lib);
  }

  constructor(client, lib) {
    this.client = client;
    this.lib = lib;
    this.__v = "v3";
  }

  promiseWrap(fn, signal) {
    return {
      promise: async () => {
        if (signal && signal.aborted) {
          throw new ElectroError(
            ErrorCodes.OperationAborted,
            "The operation was aborted",
          );
        }
        try {
          return await fn();
        } catch (err) {
          if (signal && signal.aborted) {
            throw new ElectroError(
              ErrorCodes.OperationAborted,
              "The operation was aborted",
            );
          }
          throw err;
        }
      },
    };
  }

  get(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.GetCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }
  put(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.PutCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }
  update(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.UpdateCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }
  delete(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.DeleteCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }
  batchWrite(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.BatchWriteCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }
  batchGet(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.BatchGetCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }
  scan(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.ScanCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }
  query(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.QueryCommand(params);
      return this.client.send(command, { abortSignal: options.abortSignal });
    }, options.abortSignal);
  }

  transactWrite(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.TransactWriteCommand(params);
      return this.client
        .send(command, { abortSignal: options.abortSignal })
        .then((result) => {
          return result;
        })
        .catch((err) => {
          if (err.CancellationReasons) {
            return {
              canceled: err.CancellationReasons.map((reason) => {
                if (reason.Item) {
                  return unmarshallItem(reason);
                }
                return reason;
              }),
            };
          }
          throw err;
        });
    }, options.abortSignal);
  }
  transactGet(params, options = {}) {
    return this.promiseWrap(() => {
      const command = new this.lib.TransactGetCommand(params);
      return this.client
        .send(command, { abortSignal: options.abortSignal })
        .then((result) => {
          return result;
        })
        .catch((err) => {
          if (err.CancellationReasons) {
            return {
              canceled: err.CancellationReasons.map((reason) => {
                if (reason.Item) {
                  return unmarshallItem(reason);
                }
                return reason;
              }),
            };
          }
          throw err;
        });
    }, options.abortSignal);
  }
  createSet(value) {
    if (Array.isArray(value)) {
      return new Set(value);
    } else {
      return new Set([value]);
    }
  }
}

function identifyClientVersion(client = {}) {
  if (
    client instanceof DocumentClientV3Wrapper ||
    client instanceof DocumentClientV2Wrapper
  ) {
    return DocumentClientVersions.electro;
  }
  for (const [version, methods] of Object.entries(supportedClientVersions)) {
    const hasMethods = methods.every((method) => {
      return method in client && isFunction(client[method]);
    });
    if (hasMethods) {
      return version;
    }
  }
}

function normalizeClient(client) {
  if (client === undefined) return client;
  const version = identifyClientVersion(client);
  switch (version) {
    case DocumentClientVersions.v3:
      return DocumentClientV3Wrapper.init(client);
    case DocumentClientVersions.v2:
      return DocumentClientV2Wrapper.init(client);
    case DocumentClientVersions.electro:
      return client;
    default:
      throw new ElectroError(
        ErrorCodes.InvalidClientProvided,
        "Invalid DynamoDB Document Client provided. ElectroDB supports the v2 and v3 DynamoDB Document Clients from the aws-sdk",
      );
  }
}

function normalizeConfig(config = {}) {
  return {
    ...config,
    client: normalizeClient(config.client),
  };
}

module.exports = {
  util,
  v2Methods,
  v3Methods,
  normalizeClient,
  normalizeConfig,
  identifyClientVersion,
  DocumentClientVersions,
  supportedClientVersions,
  DocumentClientV3Wrapper,
  DocumentClientV2Wrapper,
};
