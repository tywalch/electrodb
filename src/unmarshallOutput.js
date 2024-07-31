const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const processObj = (obj, processFunc, children) => {
  if (obj !== undefined) {
    if (!children || (Array.isArray(children) && children.length === 0)) {
      return processFunc(obj);
    } else {
      if (Array.isArray(children)) {
        return processKeysInObj(obj, processFunc, children);
      } else {
        return processAllKeysInObj(obj, processFunc, children.children);
      }
    }
  }
  return undefined;
};
const processKeyInObj = (obj, processFunc, children) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => processObj(item, processFunc, children));
  }
  return processObj(obj, processFunc, children);
};
const processKeysInObj = (obj, processFunc, keyNodes) => {
  const accumulator = { ...obj };
  return keyNodes.reduce((acc, { key, children }) => {
    acc[key] = processKeyInObj(acc[key], processFunc, children);
    return acc;
  }, accumulator);
};
const processAllKeysInObj = (obj, processFunc, children) =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = processKeyInObj(value, processFunc, children);
    return acc;
  }, {});
const unmarshallOutput = (obj, keyNodes, options) => {
  const unmarshallFunc = (toMarshall) =>
    (0, util_dynamodb_1.unmarshall)(toMarshall, options);
  return processKeysInObj(obj, unmarshallFunc, keyNodes);
};
exports.unmarshallOutput = unmarshallOutput;
