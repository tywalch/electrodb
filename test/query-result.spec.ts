import { expect } from "chai";
const { ElectroQueryResult } = require("../src/query-result");

describe("ElectroQueryResult promise-like behavior", () => {
  function createResult<T>(value: T) {
    let resolveCount = 0;
    let iterateCount = 0;
    const result = new ElectroQueryResult({
      resolve: () => {
        resolveCount++;
        return Promise.resolve(value);
      },
      iterate: async function* () {
        iterateCount++;
        yield value;
      },
    });
    return { result, getResolveCount: () => resolveCount, getIterateCount: () => iterateCount };
  }

  describe("lazy resolution", () => {
    it("should not call resolve until .then() is called", async () => {
      const { result, getResolveCount } = createResult("hello");
      expect(getResolveCount()).to.equal(0);
      await result.then(() => {});
      expect(getResolveCount()).to.equal(1);
    });

    it("should not call resolve until .catch() is called", async () => {
      const { result, getResolveCount } = createResult("hello");
      expect(getResolveCount()).to.equal(0);
      await result.catch(() => {});
      expect(getResolveCount()).to.equal(1);
    });

    it("should not call resolve until .finally() is called", async () => {
      const { result, getResolveCount } = createResult("hello");
      expect(getResolveCount()).to.equal(0);
      await result.finally(() => {});
      expect(getResolveCount()).to.equal(1);
    });

    it("should not call resolve when only iterating", async () => {
      const { result, getResolveCount } = createResult("hello");
      for await (const _page of result) {
        // consume
      }
      expect(getResolveCount()).to.equal(0);
    });
  });

  describe("cached resolution", () => {
    it("should only call resolve once across multiple .then() calls", async () => {
      const { result, getResolveCount } = createResult({ data: [1, 2, 3] });
      await result.then(() => {});
      await result.then(() => {});
      await result.then(() => {});
      expect(getResolveCount()).to.equal(1);
    });

    it("should return the same value from multiple .then() calls", async () => {
      const { result } = createResult({ data: [1, 2, 3] });
      const a = await result.then((v: { data: number[] }) => v.data);
      const b = await result.then((v: { data: number[] }) => v.data);
      expect(a).to.deep.equal(b);
      expect(a).to.equal(b); // same reference
    });

    it("should return the same value when awaited multiple times", async () => {
      const { result, getResolveCount } = createResult({ data: "test" });
      const a = await result;
      const b = await result;
      expect(a).to.deep.equal(b);
      expect(a).to.equal(b);
      expect(getResolveCount()).to.equal(1);
    });

    it("should only call resolve once when mixing .then(), .catch(), and .finally()", async () => {
      const { result, getResolveCount } = createResult("value");
      await result.then(() => {});
      await result.catch(() => {});
      await result.finally(() => {});
      expect(getResolveCount()).to.equal(1);
    });
  });

  describe("multiple handlers", () => {
    it("should allow multiple .then() handlers on the same instance", async () => {
      const { result } = createResult(42);
      const p1 = result.then((v: number) => v + 1);
      const p2 = result.then((v: number) => v * 2);
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).to.equal(43);
      expect(r2).to.equal(84);
    });

    it("should call .finally() handler and preserve the resolved value", async () => {
      const { result } = createResult("preserved");
      let finallyCalled = false;
      const value = await result.finally(() => {
        finallyCalled = true;
      });
      expect(finallyCalled).to.be.true;
      expect(value).to.equal("preserved");
    });
  });

  describe("error handling", () => {
    it("should propagate rejection through .then()", async () => {
      const error = new Error("test error");
      const result = ElectroQueryResult.reject(error);
      const caught = await result.then(
        () => "should not reach",
        (err: Error) => err.message,
      );
      expect(caught).to.equal("test error");
    });

    it("should propagate rejection through .catch()", async () => {
      const error = new Error("catch me");
      const result = ElectroQueryResult.reject(error);
      const caught = await result.catch((err: Error) => err.message);
      expect(caught).to.equal("catch me");
    });

    it("should propagate rejection through .finally() and still reject", async () => {
      const error = new Error("finally error");
      const result = ElectroQueryResult.reject(error);
      let finallyCalled = false;
      try {
        await result.finally(() => {
          finallyCalled = true;
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).to.equal(error);
      }
      expect(finallyCalled).to.be.true;
    });

    it("should throw when async iterating a rejected result", async () => {
      const error = new Error("iter error");
      const result = ElectroQueryResult.reject(error);
      try {
        for await (const _page of result) {
          expect.fail("should not yield");
        }
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });

    it("rejected result should reject consistently across multiple .then() calls", async () => {
      const error = new Error("consistent");
      const result = ElectroQueryResult.reject(error);
      const a = await result.catch((err: Error) => err.message);
      const b = await result.catch((err: Error) => err.message);
      expect(a).to.equal("consistent");
      expect(b).to.equal("consistent");
    });
  });

  describe("async iteration independence", () => {
    it("each iteration should create a fresh iterator", async () => {
      let iterateCount = 0;
      const result = new ElectroQueryResult({
        resolve: () => Promise.resolve("resolved"),
        iterate: async function* () {
          iterateCount++;
          yield { data: [iterateCount], cursor: null };
        },
      });

      const first: number[][] = [];
      for await (const page of result) {
        first.push((page as { data: number[] }).data);
      }

      const second: number[][] = [];
      for await (const page of result) {
        second.push((page as { data: number[] }).data);
      }

      expect(iterateCount).to.equal(2);
      expect(first[0]).to.deep.equal([1]);
      expect(second[0]).to.deep.equal([2]);
    });
  });

  describe("Symbol.toStringTag", () => {
    it("should have a toStringTag of 'ElectroQueryResult'", () => {
      const { result } = createResult("test");
      expect(result[Symbol.toStringTag]).to.equal("ElectroQueryResult");
    });

    it("should produce correct Object.prototype.toString output", () => {
      const { result } = createResult("test");
      expect(Object.prototype.toString.call(result)).to.equal(
        "[object ElectroQueryResult]",
      );
    });
  });

  describe("Promise.all / Promise.race compatibility", () => {
    it("should work with Promise.all", async () => {
      const { result: r1 } = createResult(1);
      const { result: r2 } = createResult(2);
      const [v1, v2] = await Promise.all([r1, r2]);
      expect(v1).to.equal(1);
      expect(v2).to.equal(2);
    });

    it("should work with Promise.race", async () => {
      const { result: r1 } = createResult("first");
      const value = await Promise.race([r1]);
      expect(value).to.equal("first");
    });

  });
});
