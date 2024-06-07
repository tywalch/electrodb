// @ts-check
const { expect } = require("chai");
const { EventManager } = require("../src/events");

describe("safe listeners", () => {
  it("should capture and suppress thrown exceptions", () => {
    const fn = () => {
      throw new Error("Expected error for testing, you can ignore");
    };
    const safeFn = EventManager.createSafeListener(fn);
    expect(() => safeFn()).to.not.throw();
  });

  it("should ignore undefined callbacks", () => {
    const fn = undefined;
    const safeFn = EventManager.createSafeListener(fn);
    expect(safeFn).to.be.a("function");
  });

  it("should convert undefined elements to no-op functions", () => {
    /** @type {any[]} */
    const fns = [() => {}, () => {}, undefined, () => {}];
    const normalized = EventManager.normalizeListeners(fns);
    expect(normalized).to.be.an("array").with.length(4);
    expect(normalized).to.not.include(undefined);
  });

  it("should throw if element is not function or undefined", () => {
    /** @type {any[]} */
    const fns = [() => {}, () => {}, undefined, 123];
    expect(() => EventManager.normalizeListeners(fns)).to.throw(
      `Provided listener is not of type 'function' - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-listener-provided`,
    );
  });

  it("should throw if provided parameter is not array", () => {
    /** @type {any} */
    const arg = 1234;
    expect(() => EventManager.normalizeListeners(arg)).to.throw(
      `Listeners must be provided as an array of functions - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-listener-provided`,
    );
  });
});
