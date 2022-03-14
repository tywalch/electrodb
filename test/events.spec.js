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
});