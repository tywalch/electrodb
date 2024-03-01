// @ts-check
const e = require("./errors");
const v = require("./validations");

/**
 * @typedef {import("..").ElectroEventListener} ElectroEventListener
 * @typedef {import("..").ElectroEvent} ElectroEvent
 */

/**
 * @see {@link https://electrodb.dev/en/reference/events-logging/ | Events and Logging} for more information.
 * @class
 */
class EventManager {
  /**
   * @type {Array<ElectroEventListener>}
   * */
  #listeners;

  /**
   * Wraps the provided listener in order to safely invoke it.
   * @static
   * @template {(...args: any[]) => void} T
   * @param {T} [listener] - The listener to wrap.
   */
  static createSafeListener(listener) {
    if (listener === undefined) {
      // no-op
      return () => {};
    }

    if (!v.isFunction(listener)) {
      throw new e.ElectroError(
        e.ErrorCodes.InvalidListenerProvided,
        `Provided listener is not of type 'function'`,
      );
    }

    /** @param {Parameters<T>} args */
    return (...args) => {
      try {
        listener(...args);
      } catch (err) {
        console.error(`Error invoking user supplied listener`, err);
      }
    };
  }

  /**
   * @static
   * @template {(...args: any[]) => void} T
   * @param {T[]} [listeners=[]]
   */
  static normalizeListeners(listeners = []) {
    if (!Array.isArray(listeners)) {
      throw new e.ElectroError(
        e.ErrorCodes.InvalidListenerProvided,
        `Listeners must be provided as an array of functions`,
      );
    }

    return listeners.map((listener) =>
      EventManager.createSafeListener(listener),
    );
  }

  /**
   * @constructor
   * @param {Object} [config={}]
   * @param {Array<ElectroEventListener>} [config.listeners=[]] An array of listeners to be invoked after certain request lifecycles.
   */
  constructor({ listeners = [] } = {}) {
    this.#listeners = EventManager.normalizeListeners(listeners);
  }

  /**
   * @param {ElectroEventListener | Array<ElectroEventListener>} [listeners=[]]
   */
  add(listeners = []) {
    if (!Array.isArray(listeners)) {
      listeners = [listeners];
    }

    this.#listeners = this.#listeners.concat(
      EventManager.normalizeListeners(listeners),
    );
  }

  /**
   * @param {ElectroEvent} event
   * @param {Array<ElectroEventListener>} [adHocListeners=[]]
   */
  trigger(event, adHocListeners = []) {
    const allListeners = [
      ...this.#listeners,
      ...EventManager.normalizeListeners(adHocListeners),
    ];

    for (const listener of allListeners) {
      listener(event);
    }
  }
}

module.exports = {
  EventManager,
};
