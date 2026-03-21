"use strict";

class ElectroQueryResult {
  constructor({ resolve, iterate }) {
    this._resolve = resolve;
    this._iterate = iterate;
    this._promise = null;
  }

  then(onFulfilled, onRejected) {
    if (!this._promise) {
      this._promise = this._resolve();
    }
    return this._promise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(onFinally) {
    if (!this._promise) {
      this._promise = this._resolve();
    }
    return this._promise.finally(onFinally);
  }

  get [Symbol.toStringTag]() {
    return "ElectroQueryResult";
  }

  [Symbol.asyncIterator]() {
    return this._iterate();
  }

  static reject(err) {
    return new ElectroQueryResult({
      resolve: () => Promise.reject(err),
      iterate: async function*() { throw err; },
    });
  }
}

module.exports = { ElectroQueryResult };
