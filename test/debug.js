
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-west-2", endpoint: "http://localhost:8000"});
const dynamo = new AWS.DynamoDB();
const client = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid").v4;
const {Entity} = require("../src/entity");

function makeTable() {
  return dynamo.createTable({
    TableName: 'electro',
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
      { AttributeName: 'gsi1pk', AttributeType: 'S' },
      { AttributeName: 'gsi1sk', AttributeType: 'S' },
      { AttributeName: 'gsi2pk', AttributeType: 'S' },
      { AttributeName: 'gsi2sk', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'gsi1pk-gsi1sk-index',
        KeySchema: [
          { AttributeName: 'gsi1pk', KeyType: 'HASH' },
          { AttributeName: 'gsi1sk', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'gsi2pk-gsi2sk-index',
        KeySchema: [
          { AttributeName: 'gsi2pk', KeyType: 'HASH' },
          { AttributeName: 'gsi2sk', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  }).promise();
}

const TasksModel = {
  entity: "anytype",
  version: "1",
  service: "taskapp",
  table: "electro",
  attributes: {
    task: {
      type: "string",
      default: () => uuid(),
    },
    project: {
      type: "string",
      required: true,
    },
    employee: {
      type: "string"
    },
    description: {
      type: "string",
    },
    points: {
      type: "number",
    },
    type: {
      type: ["story", "defect", "epic"]
    },
    comments: {
      type: "any"
    }
  },
  indexes: {
    task: {
      pk: {
        field: "pk",
        facets: ["task"],
      },
      sk: {
        field: "sk",
        facets: ["project", "employee"],
      },
    },
    projects: {
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        facets: ["project"],
      },
      sk: {
        field: "gsi1sk",
        facets: ["employee", "task"],
      },
    },
    assigned: {
      collection: "assignments",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        field: "gsi2pk",
        facets: ["employee"],
      },
      sk: {
        field: "gsi2sk",
        facets: ["project", "task"],
      },
    },
  },
};

const Tasks = new Entity(TasksModel, {client});

const employees = [
  "Jack",
  "Tyler",
  "David",
  "Shane",
  "Zack",
  "Stephanie",
  "Georgina",
  "Michele",
  "Ronda",
  "Paula",
  "Fred"
];

const projects = [
  "135-53",
  "460-63",
  "372-55",
  "552-77",
  "636-33",
  "360-56"
];
const types = ["story", "defect", "epic"];

const sentences = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum condimentum eros ut auctor cursus. Vivamus ac malesuada purus. Phasellus scelerisque tellus non nisi tempus, eget sagittis metus tempus. Mauris eu sapien non magna vulputate lobortis. Maecenas posuere enim et dolor ultrices, et tempus ligula scelerisque. Mauris vehicula turpis nec mi blandit convallis. Curabitur lacinia quis eros in blandit. Aliquam sed mauris auctor, tincidunt risus sed, fringilla turpis. Vestibulum molestie nec mauris vel sollicitudin. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Integer vitae orci sem. Vivamus finibus molestie lectus vel tempus. Curabitur rutrum, mauris sit amet blandit imperdiet, nibh purus molestie diam, sit amet maximus odio quam lacinia nisi. Proin laoreet dictum auctor. Mauris placerat commodo nisl in condimentum. Pellentesque non magna diam. Quisque in varius metus. Aenean lorem tellus, gravida nec egestas eu, rutrum id lectus. Ut id lacus leo. Donec dignissim id eros vitae auctor. Nunc tincidunt diam id fermentum placerat. Aliquam efficitur felis metus, id tincidunt lacus tincidunt a. Aliquam erat volutpat. Integer nec quam at metus suscipit viverra. Pellentesque non imperdiet est. Proin suscipit justo ex, eget condimentum leo imperdiet ac. Fusce efficitur purus a convallis euismod. Integer eget nibh erat. Mauris id venenatis urna. Nullam orci lorem, sollicitudin sit amet sapien ornare, euismod lacinia lacus. Aenean vel eros sagittis, dignissim orci et, posuere nunc. Maecenas vel est elit. Nam ac dui nec justo aliquet volutpat vel eget risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer eu nisl purus. Vestibulum finibus lorem euismod, facilisis ex quis, commodo enim. Nullam placerat lobortis lacus, vitae blandit risus gravida in. Duis quis ultricies orci, non rhoncus ligula. Praesent rhoncus urna sed aliquam sodales. Nunc blandit ut quam id porta. Aliquam erat volutpat. Morbi ultrices ornare ante id dictum. Suspendisse potenti. Quisque interdum imperdiet erat. Interdum et malesuada fames ac ante ipsum primis in faucibus. Vestibulum tincidunt erat quis vestibulum venenatis. Cras vel convallis urna. Proin imperdiet odio nisi, et euismod tortor porttitor at. Pellentesque pharetra mi sed quam cursus viverra. Pellentesque tellus nisi, placerat sed nibh iaculis, viverra rutrum ligula. Fusce condimentum scelerisque lorem non efficitur. Suspendisse ac malesuada lectus. Etiam id cursus orci, ut sollicitudin augue. Morbi et metus dapibus, feugiat risus et, accumsan ligula. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin sodales et nibh at lacinia. Morbi velit tellus, ultricies ac venenatis ac, dignissim eu neque. Quisque placerat magna eget nibh porttitor, a ultricies turpis pellentesque. Phasellus fringilla egestas erat, id interdum sem imperdiet et. Duis diam lorem, feugiat at lacinia sit amet, elementum at libero. Sed vehicula eu velit ut porta. Phasellus ac fermentum urna, a viverra justo. Aliquam vel mi et libero suscipit finibus ut vel purus. Aenean id leo ut felis sollicitudin finibus id sed urna. Donec et purus purus. Morbi euismod condimentum augue, et hendrerit justo elementum et. Nulla dictum et mauris id hendrerit. Aenean non dolor lobortis, convallis metus quis, euismod felis. Curabitur et pretium nunc, a accumsan enim. Donec tempor orci vel pharetra commodo. Mauris sit amet metus porttitor, porttitor ipsum non, aliquet sapien. Proin eu pharetra dolor, sed ultricies arcu. Donec venenatis elementum nisl at varius. Ut sed scelerisque risus. Vestibulum quis leo non sapien eleifend auctor id consequat velit. Maecenas porta felis vitae velit dictum elementum. Vivamus rutrum sodales cursus. Nullam eros ante, fermentum nec nunc non, bibendum iaculis dui. Mauris enim justo, feugiat vitae massa eget, lobortis iaculis purus. Suspendisse tellus nibh, semper vitae purus sed, luctus cursus turpis. Donec id vehicula odio. Nunc non diam ac est vestibulum mattis. Phasellus mattis ipsum eu condimentum convallis. Vivamus tempor massa eu ullamcorper condimentum. Nam ultricies in mauris sit amet pellentesque. Suspendisse dui lectus, pellentesque in volutpat nec, consectetur vitae mi. Duis mi libero, laoreet at turpis vitae, rutrum commodo nulla. Maecenas viverra arcu in elit aliquet malesuada. Integer diam erat, egestas et nulla a, gravida condimentum massa. Nulla malesuada ex ut cursus viverra. In commodo lacinia libero, ac elementum lectus maximus ut. Donec eget lorem quis mi suscipit sagittis. Nunc placerat odio quis mauris iaculis, maximus rutrum est tempor. Integer sollicitudin ipsum urna, at malesuada diam accumsan quis. Praesent eu eleifend urna. Pellentesque molestie diam sit amet tristique condimentum. Aliquam fringilla et nisi vel fermentum. Vivamus elit leo, maximus in dolor ac, vestibulum commodo mi. Ut id nisi nec massa faucibus vulputate sit amet nec ligula. Integer sapien purus, bibendum in sollicitudin a, mollis a purus. Donec quis libero nisl. Mauris blandit ipsum nibh, at ultricies sapien volutpat quis. Integer nec leo efficitur, posuere nisi sed, placerat ante. Nullam malesuada nec tellus eu condimentum. Vestibulum porttitor fermentum dui, vel efficitur neque rhoncus vel. Maecenas sollicitudin gravida leo non mattis. Morbi vehicula mauris eu sagittis ullamcorper. Nam pellentesque molestie consectetur. Vivamus finibus enim justo, eu lacinia arcu iaculis et. Nullam iaculis diam sit amet velit varius, egestas rhoncus nulla venenatis. Duis at eros nibh. Sed sit amet finibus arcu. Aliquam venenatis felis sit amet odio blandit, ut faucibus tellus volutpat. Integer sit amet leo neque. Nullam ullamcorper ullamcorper turpis, vitae feugiat eros varius egestas. Morbi varius luctus augue, quis egestas eros fermentum vel. Nam semper tincidunt ornare. Sed at blandit justo, nec volutpat erat. Vivamus consequat, sapien at laoreet vulputate, urna ante pharetra libero, at faucibus lacus nunc sit amet turpis. Cras luctus diam sit amet bibendum fringilla. Nullam at erat a metus consectetur congue. Nulla accumsan nisl ac lacus vulputate iaculis. Sed interdum aliquet ligula, sit amet rutrum nisi aliquam et. Etiam faucibus at erat nec congue. Integer sed sapien ac lacus finibus pellentesque. Sed convallis erat enim, eget mattis tellus tincidunt ac. Cras nec ultricies purus, sed vestibulum est. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus sit amet nulla quis odio feugiat venenatis. Proin quis elit ante. Vestibulum nec magna quis magna bibendum dignissim. Morbi venenatis ligula et enim semper tincidunt. In hac habitasse platea dictumst. Nulla sodales arcu eu ipsum imperdiet suscipit id sed augue. Pellentesque accumsan diam purus, sed elementum orci consequat quis. Sed nec dolor quis turpis finibus fermentum. Donec imperdiet elementum leo varius fermentum. Maecenas vitae euismod leo, a euismod nunc. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque sit amet enim et libero eleifend eleifend. Quisque efficitur neque nulla, quis lobortis orci tempor et. Duis non viverra ligula. Sed elementum, ex sit amet molestie lobortis, sapien diam condimentum tortor, nec mollis mi odio ac lacus. Mauris non augue turpis. Cras venenatis faucibus augue sit amet vulputate. Pellentesque sit amet tempus nisl. Aenean ultrices neque nec ipsum malesuada tincidunt. Pellentesque iaculis mauris magna, ut ornare nulla congue sed. Nullam quis convallis leo. Donec bibendum a arcu pharetra dictum. Sed varius commodo lectus eu bibendum. Vivamus vel condimentum ligula, nec pharetra nunc. Suspendisse malesuada est in eros accumsan, nec tempus diam lacinia. Integer vel dui in ante tempor pharetra in id magna. Aliquam erat volutpat. Cras ligula est, fringilla quis egestas a, ornare at nisi. Integer cursus imperdiet libero ut eleifend. Donec mollis arcu eu lacus euismod egestas. Sed a arcu nec turpis vestibulum porta eu nec elit. Vivamus id tellus vitae lacus euismod vehicula in eget purus. Suspendisse potenti. Praesent vel lectus pulvinar, feugiat urna eu, sodales lacus. Ut sed leo in nisl vestibulum bibendum eget id velit. Donec efficitur lacus ut commodo gravida. Duis placerat, turpis eget placerat pulvinar, nisi est ultricies velit, in ullamcorper lorem odio vel lorem. Cras velit velit, cursus imperdiet suscipit sed, pretium quis purus. Cras neque est, sodales nec congue in, faucibus eget magna. Nulla feugiat, massa at blandit lacinia, tellus dui suscipit velit, id eleifend lacus diam at orci. Donec sit amet ultrices nulla. Maecenas quis sapien a libero laoreet ultrices. Curabitur et ullamcorper elit. Phasellus faucibus volutpat orci. Curabitur suscipit mattis aliquet. Etiam vehicula varius ante, sed blandit leo mattis quis. Donec eu sapien cursus lacus tempor ultricies. Proin fermentum diam id ligula aliquam varius. Vestibulum ac finibus sapien. Donec ultricies eros vel tellus porttitor cursus. Morbi auctor ipsum metus, sed malesuada orci convallis vel. Vestibulum quis leo eget quam malesuada faucibus ac eu erat. Praesent arcu eros, pulvinar non ante id, luctus sodales risus. In non arcu eget justo rutrum tempus vel sit amet nulla. Maecenas eu diam nisl. Phasellus vitae felis vehicula, pulvinar enim nec, pulvinar felis. Nullam ac justo dui. Nam lectus nibh, porttitor in lacus sit amet, hendrerit maximus orci. Integer scelerisque massa porttitor felis ultrices accumsan. Duis rhoncus lectus ut risus suscipit placerat. Morbi tristique egestas mi ac accumsan. Proin vulputate tempor dui quis congue. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam nisl ipsum, lacinia id interdum non, venenatis vel nisl. Maecenas tincidunt urna nisl, id ullamcorper ipsum placerat et. Etiam congue lacus vel justo aliquam, id sollicitudin turpis tempor. Phasellus vehicula arcu sed risus hendrerit interdum. Vivamus sit amet risus lobortis, egestas diam non, placerat tellus. In vitae diam augue. In blandit, metus sed pharetra mattis, mauris nulla consectetur eros, sit amet cursus metus mauris nec lacus. Vivamus suscipit ac elit a ultricies. Aenean accumsan sapien at lectus cursus eleifend. Sed iaculis non metus sit amet lacinia. Aliquam id sapien a sapien vehicula tincidunt. Aenean maximus venenatis nunc et lobortis. Aliquam tristique auctor sapien a sagittis. Curabitur congue tellus turpis, at lacinia ex tincidunt ultrices. Phasellus ornare vel enim non tincidunt. Sed quis odio viverra, scelerisque est a, efficitur quam. Suspendisse dictum ultricies risus, id venenatis dui pulvinar et. Pellentesque gravida ligula nisi, et elementum magna egestas ac. Sed ornare est in interdum pretium. Proin sit amet tincidunt neque. Phasellus ac lacus vitae libero finibus eleifend quis et turpis. Nullam accumsan semper tortor non ultricies. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Quisque semper urna id ligula placerat, in aliquet velit dapibus. Proin in velit velit. Donec mattis felis eros, pharetra facilisis nisl tristique vel. Praesent cursus rhoncus accumsan. Nullam egestas bibendum elit, at finibus metus sodales id. Nulla facilisi. Nam euismod sem arcu, nec vulputate dui blandit et. Integer pellentesque a velit ornare volutpat. In facilisis sodales risus a imperdiet. Vestibulum bibendum, dui et mollis dictum, quam tortor consectetur augue, id accumsan tortor arcu vitae eros. Etiam et libero tortor. Ut at nisl vitae mi iaculis convallis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris eleifend pellentesque fringilla. Mauris vel risus justo. Mauris sed molestie lacus. Mauris sagittis id arcu a fringilla. Cras eget neque sed lorem venenatis mollis non vel mi. Aenean feugiat sem non volutpat malesuada. Sed enim mi, rhoncus a imperdiet eget, feugiat cursus nisl. Donec ut auctor nibh. Mauris vitae tempor ligula, eget sagittis lacus. Sed vitae aliquet nisi. Sed porttitor ullamcorper orci, eget volutpat sem consectetur in. Nam pretium egestas pretium. Etiam eu mattis est. Ut pulvinar lectus sit amet lectus venenatis laoreet. Nullam lectus quam, scelerisque id laoreet ut, elementum et dolor. Etiam imperdiet eu magna id ornare. Ut blandit tristique tellus. Proin feugiat dolor sit amet fermentum dignissim. Vestibulum aliquam vestibulum fermentum. Nulla auctor, dolor porta hendrerit efficitur, ex turpis facilisis diam, a sollicitudin nulla ante eu risus. Nulla iaculis, mi a mattis sollicitudin, nibh lorem rhoncus felis, vel vestibulum lacus leo ut turpis. Nullam eget ipsum id metus elementum tristique non ac mi. Praesent ut pulvinar eros. Aenean id purus ipsum. In auctor tellus quis lacus imperdiet vehicula. Duis volutpat sodales maximus. Suspendisse placerat tellus tortor. Aenean bibendum erat quis enim faucibus finibus. Aenean urna risus, dapibus ac pellentesque vitae, gravida quis nibh. Ut dui augue, suscipit et purus vel, tristique condimentum dolor. Donec vestibulum iaculis posuere. Maecenas congue nulla sed faucibus porta. Proin in feugiat nisl.`.split(".")

const points = [
  1,
  2,
  3,
  5,
  8,
  13,
  21,
  50,
  100
];

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function generateRandomComments() {
  let comments = [];
  for (let i = 0; i < getRandomNumber(2, 6); i++) {
    let text = [];
    for (let j = 0; j < getRandomNumber(4, 10); j++) {
      text.push(sentences[getRandomNumber(0, sentences.length)]);
    }
    comments.push({
      author: employees[getRandomNumber(0, employees.length)],
      text: text.join(".") + "."
    })
  }
  return comments;
}
function generateRandomRecord() {
  return {
    employee: employees[getRandomNumber(0, employees.length)],
    project: projects[getRandomNumber(0, projects.length)],
    type: types[getRandomNumber(0, types.length)],
    points: points[getRandomNumber(0, points.length + 4)],
    description: sentences[getRandomNumber(0, sentences.length)],
    comments: generateRandomComments()
  }
}

async function load(total)  {
  let inserts = [];
  for (let i = 0; i < total; i++) {
    inserts.push(
      Tasks.put(generateRandomRecord()).go()
    )
  }
  return Promise.all(inserts)
}

// load(100).then(console.log).catch(console.log);
async function queryPage(Limit = 10, next = null) {
  let [page, tasks] = await Tasks.query.projects({project: "135-53"}).page(next, {includeKeys: true, params: {Limit}});
  return {page, tasks, type: "query"};
}

async function assignedPage(Limit = 10, next = null) {
  let [page, tasks] = await Tasks.query.assigned({employee: employees[0]}).page(next, {includeKeys: true, originalErr: true, params: {Limit}});
  return {page, tasks, type: "query"};
}

async function scanPage(Limit = 10, next = null) {
  let [page, tasks] = await Tasks.scan.page(next, {includeKeys: true, params: {Limit}});
  return {page, tasks, type: "scan"};
}

function compareOrder({page = {}, tasks = [], type} = {}) {
  let original = JSON.parse(JSON.stringify(tasks));
  let sorted = tasks.sort((a, z) => (a.pk + a.sk) - (z.pk + z.sk));
  for (let i = 0; i < tasks.length; i++) {
    let pkMatch = sorted[i].pk = original[i].pk;
    let skMatch = sorted[i].sk = original[i].sk;
    let pageMatch = page && sorted[i].project === page.project && sorted[i].employee === page.employee && sorted[i].task === page.task;
    
    if (!pkMatch) {
      console.log(i, tasks.length, "No PK Match", sorted[i].pk, original[i].pk);
    }
    if (!skMatch) {
      console.log(i, tasks.length, "No SK Match", sorted[i].sk, original[i].sk);
    }
    if (pageMatch) {
      console.log(i, tasks.length, "Page in results!");
    }
  }
  return [page, tasks];
}

async function multiPage(fn, op, limit, pages = 1) {
  var next;
  let results = [];
  for (let i = 0; i < pages; i++) {
    if (next === null) {
      break;
    }
    var [next, tasks] = await fn(limit, next).then(op);
    results = [...results, ...tasks];
  }
  return results
} 

// queryPage(10).then(compareOrder).catch(console.log);
// scanPage(10).then(compareOrder).catch(console.log);
// multiPage(assignedPage, 10, 20).then(results => console.log("TOTAL", results.length)).catch(console.log);
// multiPage(scanPage, compareOrder, 10, 1000).then(results => console.log("TOTAL", results.length)).catch(console.log);
// multiPage(queryPage, 10, 1000).then(results => console.log("TOTAL", results.length)).catch(console.log);
// multiPage(scanPage, 10, 20).catch(console.log);
// makeTable().then(console.log).catch(console.log)
// load(2000).then(console.log).catch(console.log);
// Tasks.scan.go({params: {Limit: 10}}).then(console.log).catch(console.log);

