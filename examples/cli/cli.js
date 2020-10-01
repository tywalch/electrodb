const commander = require('commander');

function ErrorAndExit(err) {
  console.log(err.message || err);
  process.exit(1);
}

commander.version("0.0.1");

function buildFilter(attributes) {
  return function(val, arr) {
    let [attr, operation, value1, value2] = val.split(" ");
    if (attr === undefined || operation === undefined || val === undefined) {
      throw new Error(`Filters must be in the format of "<attribute> <operation> <value>"`);
    }
    let attribute = attributes.find(attribute => attribute.toLowerCase() === attr.toLowerCase());
    if (!attribute) {
      throw new Error(`Filter attribute ${attr} is not a valid attribute. Valid attributes include ${attributes.join(", ")}.`);
    }
    arr.push({attribute, operation, value1, value2});
    return arr;
  }
}

function appendOptions(command, entity) {
  let attributes = Object.keys(entity.model.schema.attributes)
  let filter = buildFilter(attributes);
  return command
    .option("-r, --raw", "Get raw field response")
    .option("-p, --params", "Get docClient params")
    .option("-t, --table <table>", "Define which table to use", entity.model.table)
    .option(`-f, --filter <expression>`, `Supply a filter expression "<attribute> <operation> <value>". Available attributes include ${attributes.join(", ")}`, filter, [])
}

function executeQuery(query, entity, options) {
  for (let filter of options.filter) {
    query.filter(attr => {
      if (filter.value2) {
        return `${attr[filter.attribute][filter.operation](filter.value1, filter.value2)}`
      } else {
        return `${attr[filter.attribute][filter.operation](filter.value1)}`
      }
    })
  }

  if (options.table) {
    entity.model.table = options.table;
  }

  if (options.params) {
    return console.log(query.params())
  }

  return query.go()
    .then(data => console.log(JSON.stringify(data, null, 2)))
}

async function scanOperation(entity, options) {
  let query = entity.scan;
  await executeQuery(query, entity, options);
}

async function deleteOperation(entity, ...params) {
  try {
    let options = params[params.length - 1];
    let facets = {};
    for (let i = 0; i < entity.model.facets.byIndex[""].all.length; i++) {
      if (params[i] !== undefined) {
        facets[entity.model.facets.byIndex[""].all[i].name] = params[i];
      }
    }
    let query = entity.delete(facets);
    await executeQuery(query, entity, options)
  } catch(err) {
    ErrorAndExit(err);
  }
}

async function queryOperation(entity, index, attributes, ...params) {
  try {
    let options = params[params.length-1];
    let facets = {};
    for (let i = 0; i < attributes.length; i++) {
      if (params[i] !== undefined) {
        facets[attributes[i]] = params[i];
      }
    }
    let query = entity.query[index](facets);
    await executeQuery(query, entity, options);
  } catch (err) {
    ErrorAndExit(err)
  }
}

function buildScan(program, entity) {
  let scan = program.command(`scan`);
  scan = appendOptions(scan, entity);
  scan.action(async (options) => scanOperation(entity, options));
}

function buildDelete(program, entity) {
  let removeFacets = entity.model.facets.byIndex[""].all.map(facet => `<${facet.name}>`).join(" ");
  let remove = program.command(`delete ${removeFacets}`);
  remove = appendOptions(remove, entity);
  remove.action(async (...params) => deleteOperation(entity, ...params));
}

function buildQuery(program, entity, index, definition) {
  let pkFacets = [...definition.pk.facets];
  let skFacets = [...definition.sk.facets];
  let pkParams = pkFacets.map(facet => `<${facet}>`).join(" ");
  let skParams = skFacets.map(facet => `[${facet}]`).join(" ");
  let command = program.command(`${index.toLowerCase()} ${pkParams} ${skParams}`);
  command = appendOptions(command, entity);
  command.action(async (...params) => queryOperation(entity, index, [...pkFacets, ...skFacets], ...params));
}

function getEntities(instance = {}) {
  let entities = {};
  let description = instance._instance && instance._instance.description;  
  if (description === "entity") {
    entities[instance.model.entity] = instance
  } else if (description === "service") {
    entities = instance.entities;
  } else {
    throw new Error("Invalid entity");  
  }
  return entities;
}

module.exports = function(instance) {
  let entities = getEntities(instance);
  for (let name of Object.keys(entities)) {
    let entity = entities[name];
    let program = new commander.Command(name.toLowerCase());
    buildScan(program, entity)
    buildDelete(program, entity);
    for (let index of Object.keys(entity.model.indexes)) {
      let definition = entity.model.indexes[index];
      buildQuery(program, entity, index, definition);
    }
    commander.addCommand(program);
  }

  try {
    commander.parse(process.argv);
  } catch(err) {
    ErrorAndExit(err);
  }
}

