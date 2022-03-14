const { expect } = require("chai");
const { EventManager } = require('../src/events');

describe('safe listeners', () => {
   it('should capture and suppress thrown exceptions', () => {
      const fn = () => {
          throw new Error('Expected error, you can ignore');
      }
      const safeFn = EventManager.createSafeListener(fn);
      expect(() => safeFn()).to.not.throw();
   });

   it('should ignore undefined callbacks', () => {
      const fn = undefined;
      const safeFn = EventManager.createSafeListener(fn);
      expect(safeFn).to.equal(undefined);
   });

   it('should filter out undefined elements', () => {
      const fns = [
         () => {},
         () => {},
         undefined,
         () => {}
      ];
      const normalized = EventManager.normalizeListeners(fns);
      expect(normalized).to.be.an('array').with.length(3);
   });

   it('should throw if element is not function or undefined', () => {
      const fns = [
         () => {},
         () => {},
         undefined,
         123,
      ];
      expect(() => EventManager.normalizeListeners(fns)).to.throw(`Provided listener is not of type 'function' - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-listener-provided`);
   });

   it('should throw if provided parameter is not array', () => {
      expect(() => EventManager.normalizeListeners(1234)).to.throw(`Listeners must be provided as an array of functions - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-listener-provided`);
   });
});