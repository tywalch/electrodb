const { expect } = require("chai");
const { removeFixings, removeJSONPath } = require("../src/util");

describe("removeFixings", () => {
  it("should remove only a prefix", () => {
    const prefix = "prefix_";
    const input = "abc";
    const value = `${prefix}${input}`;
    const output = removeFixings({ prefix, value });
    expect(output).to.equal(input);
  });

  it("should remove only a postfix", () => {
    const postfix = "_postfix";
    const input = "abc";
    const value = `${input}${postfix}`;
    const output = removeFixings({ postfix, value });
    expect(output).to.equal(input);
  });

  it("should remove prefixes and postfixes", () => {
    const prefix = "prefix_";
    const postfix = "_postfix";
    const input = "abc";
    const value = `${prefix}${input}${postfix}`;
    const output = removeFixings({ prefix, value, postfix });
    expect(output).to.equal(input);
  });

  it("should return the original string", () => {
    const input = "abc";
    const value = `${input}`;
    const output = removeFixings({ value });
    expect(output).to.equal(input);
  });

  it("should ignore non-relevant prefixes", () => {
    const prefix = "prefix_";
    const postfix = "_postfix";
    const input = "abc";
    const value = `${input}${postfix}`;
    const output = removeFixings({ prefix, value, postfix });
    expect(output).to.equal(input);
  });

  it("should ignore non-relevant postfixes", () => {
    const prefix = "prefix_";
    const postfix = "_postfix";
    const input = "abc";
    const value = `${prefix}${input}`;
    const output = removeFixings({ prefix, value, postfix });
    expect(output).to.equal(input);
  });

  it("should ignore all non-relevant fixings", () => {
    const prefix = "prefix_";
    const postfix = "_postfix";
    const input = "abc";
    const value = `${input}`;
    const output = removeFixings({ prefix, value, postfix });
    expect(output).to.equal(input);
  });
});
