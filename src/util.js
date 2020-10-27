const v = require("./validations");
const types = require("./types");

function getInstanceType(instance = {}) {
  let [isModel] = v.testModel(instance);

  if (!instance || Object.keys(instance).length === 0) {
    return "";
  } else if (isModel) {
    return types.ElectroInstanceTypes.model;
  } else if (instance._instance === types.ElectroInstance.entity) {
    return types.ElectroInstanceTypes.entity
  } else if (instance._instance === types.ElectroInstance.service) {
    return types.ElectroInstanceTypes.service
  } else if (instance._instance === types.ElectroInstance.electro) {
    return types.ElectroInstanceTypes.electro
  } else {
    return ""
  }
}

function getModelVersion(model = {}) {
  let nameOnRoot = model && typeof model.entity === "string" && model.entity.length > 0;
  let nameInModelNamespace = model && model.model && typeof model.model.entity === "string" && model.model.entity.length > 0;
  if (nameInModelNamespace) {
    return types.ModelVersions.v1
  } else if (nameOnRoot) {
    return types.ModelVersions.beta;
  } else {
    return "";
  }
}

function applyBetaModelOverrides(model = {}, {service = "", version = "", table = ""} = {}) {
  let type = getModelVersion(model);
  if (type !== types.ModelVersions.beta) {
    throw new Error("Invalid model");
  }
  let copy = JSON.parse(JSON.stringify(model));
  if (v.isStringHasLength(service)) {
    copy.service = service;
  }
  if (v.isStringHasLength(version)) {
    copy.version = version;
  }
  if (v.isStringHasLength(table)) {
    copy.table = table;
  }
  return copy;
}

module.exports = {
  getInstanceType,
  getModelVersion,
  applyBetaModelOverrides
};
