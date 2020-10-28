function getPartDetail(part = "") {
  let detail = {
      expression: "",
      name: "",
      value: "",
  };
  if (part.includes("[")) {
      if (!part.match(/\[\d\]/gi)) {
          throw new Error(`Invalid path part "${part}" has bracket containing non-numeric characters.`);
      }
      let [name] = part.match(/.*(?=\[)/gi);
      detail.name = `#${name}`;
      detail.value = name;
  } else {
      detail.name = `#${part}`;
      detail.value = part;
  }
  detail.expression = `#${part}`;
  return detail;
}

function parse(path = "") {
  if (typeof path !== "string" || !path.length) {
      throw new Error("Path must be a string with a non-zero length");
  }
  let parts = path.split(/\./gi);
  let attr = getPartDetail(parts[0]).value;
  let target = getPartDetail(parts[parts.length-1]);
  if (target.expression.includes("[")) {

  }
  let names = {};
  let expressions = [];
  for (let part of parts) {
      let detail = getPartDetail(part);
      names[detail.name] = detail.value;
      expressions.push(detail.expression);
  }
  return {attr, path, names, target: target.value, expression: expressions.join(".")};
}

module.exports = {
  parse,
  getPartDetail
};
