process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const AWS = require("aws-sdk");
const uuid = require("uuid").v4;
const { expect } = require("chai");
const c = require("../src/client");
const { cursorFormatter } = require("../src/util");
const { Entity, Service } = require("../");

AWS.config.update({ 
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
 });

const client = new AWS.DynamoDB.DocumentClient();
const table = "electro";
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function noOpClientMethods() {
  return c.v2Methods.reduce((client, method) => {
    client[method] = () => {};
    return client;
  }, {});
}

function createClient({ mockResponses } = {}) {
  const calls = [];
  let count = 0;
  return {
    calls,
    client: {
      ...noOpClientMethods(),
      query(params) {
        calls.push(params);
        return {
          async promise() {
            if (Array.isArray(mockResponses)) {
              return mockResponses[count++];
            } else {
              return client.query(params).promise();
            }
          },
        };
      },
    },
  };
}

function makeTasksModel() {
  return {
    model: {
      entity: uuid(),
      version: "1",
      service: "taskapp",
    },
    attributes: {
      task: {
        type: "string",
        // default: () => uuid(),
      },
      project: {
        type: "string",
        required: true,
      },
      employee: {
        type: "string",
      },
      description: {
        type: "string",
      },
      points: {
        type: "number",
      },
      type: {
        type: ["story", "defect", "epic"],
      },
      comments: {
        type: "any",
      },
    },
    indexes: {
      task: {
        pk: {
          field: "pk",
          composite: ["task"],
        },
        sk: {
          field: "sk",
          composite: ["project", "employee"],
        },
      },
      projects: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["project"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["employee", "task"],
        },
      },
      assigned: {
        collection: "assignments",
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["employee"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["project", "points"],
        },
      },
    },
  };
}

const TasksModel = makeTasksModel();

class Tasks extends Entity {
  constructor(model, { client, table } = {}) {
    super(model, { client, table });
    this.name = model.entity;
    this.loaded = [];
    this.data = [];
    this.occurrences = {
      employees: {},
      projects: {},
    };
    for (const employee of Tasks.employees) {
      this.occurrences.employees[employee] = 0;
    }
    for (const project of Tasks.projects) {
      this.occurrences.projects[project] = 0;
    }
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  generateRandomComments() {
    let comments = [];
    for (let i = 0; i < this.getRandomNumber(2, 6); i++) {
      let text = [];
      for (let j = 0; j < this.getRandomNumber(4, 10); j++) {
        text.push(
          Tasks.sentences[this.getRandomNumber(0, Tasks.sentences.length)],
        );
      }
      comments.push({
        author:
          Tasks.employees[this.getRandomNumber(0, Tasks.employees.length)],
        text: text.join(".") + ".",
      });
    }
    return comments;
  }

  generateRandomRecord() {
    const employee =
      Tasks.employees[this.getRandomNumber(0, Tasks.employees.length)];
    const project =
      Tasks.projects[this.getRandomNumber(0, Tasks.projects.length)];
    this.occurrences.employees[employee]++;
    this.occurrences.projects[project]++;
    return {
      task: uuid(),
      employee,
      project,
      type: Tasks.types[this.getRandomNumber(0, Tasks.types.length)],
      points: Tasks.points[this.getRandomNumber(0, Tasks.points.length)],
      description:
        Tasks.sentences[this.getRandomNumber(0, Tasks.sentences.length)],
      comments: this.generateRandomComments(),
    };
  }

  static deepCopy(o) {
    return JSON.parse(JSON.stringify(o));
  }

  static compareTasks(tasksOne = [], tasksTwo = []) {
    if (tasksOne.length !== tasksTwo.length) {
      throw new Error("Tasks not the same length");
    }
    tasksOne = Tasks.deepCopy(tasksOne).sort(
      (a, z) => a.pk + a.sk - (z.pk + z.sk),
    );
    tasksTwo = Tasks.deepCopy(tasksOne).sort(
      (a, z) => a.pk + a.sk - (z.pk + z.sk),
    );
    for (let i = 0; i < tasksOne.length; i++) {
      let pkMatch = (tasksOne[i].pk = tasksTwo[i].pk);
      let skMatch = (tasksOne[i].sk = tasksTwo[i].sk);
      if (!pkMatch) {
        throw new Error(
          `No PK Match, tasksOne: ${tasksOne[i].pk}, tasksTwo: ${tasksTwo[i].pk}`,
        );
      }
      if (!skMatch) {
        throw new Error(
          `No SK Match, tasksOne: ${tasksOne[i].sk}, tasksTwo: ${tasksTwo[i].sk}`,
        );
      }
    }
  }

  async load(n = 0) {
    let inserts = [];
    for (let i = 0; i < n; i++) {
      let randomRecord = this.generateRandomRecord();
      let { Item } = this.put(randomRecord).params();
      this.data.push(Item);
      let putRecord = this.put(randomRecord)
        .go()
        .then((res) => res.data)
        .then((result) => {
          this.loaded.push(result);
        });
      inserts.push(putRecord);
    }

    return Promise.all(inserts);
  }

  async paginate(limit, pages, query, test = (data) => data) {
    var next;
    let results = [];
    for (let i = 0; i < pages; i++) {
      if (next === null) {
        break;
      }
      var [next, tasks] = await query(next, limit).then((results) =>
        test(results.cursor, results.data),
      );
      results = [...results, ...tasks];
    }
    return results;
  }

  filterLoaded(facets = {}) {
    return Tasks.deepCopy(
      this.loaded.filter((record) => {
        for (let facet of Object.keys(facets)) {
          if (record[facet] !== facets[facet]) {
            return false;
          }
        }
        return true;
      }),
    );
  }
}

Tasks.employees = [
  "Jack",
  "Tyler",
  "David",
  "Stephanie",
  "Shane",
  "Zack",
  "Georgina",
  "Michele",
  "Ronda",
  "Paula",
  "Fred",
];

Tasks.projects = ["135-53", "460-63", "372-55", "552-77", "636-33", "360-56"];

Tasks.types = ["story", "defect", "epic"];

Tasks.points = [1, 2, 3, 5, 8, 13, 21, 50, 100];

Tasks.sentences =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum condimentum eros ut auctor cursus. Vivamus ac malesuada purus. Phasellus scelerisque tellus non nisi tempus, eget sagittis metus tempus. Mauris eu sapien non magna vulputate lobortis. Maecenas posuere enim et dolor ultrices, et tempus ligula scelerisque. Mauris vehicula turpis nec mi blandit convallis. Curabitur lacinia quis eros in blandit. Aliquam sed mauris auctor, tincidunt risus sed, fringilla turpis. Vestibulum molestie nec mauris vel sollicitudin. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Integer vitae orci sem. Vivamus finibus molestie lectus vel tempus. Curabitur rutrum, mauris sit amet blandit imperdiet, nibh purus molestie diam, sit amet maximus odio quam lacinia nisi. Proin laoreet dictum auctor. Mauris placerat commodo nisl in condimentum. Pellentesque non magna diam. Quisque in varius metus. Aenean lorem tellus, gravida nec egestas eu, rutrum id lectus. Ut id lacus leo. Donec dignissim id eros vitae auctor. Nunc tincidunt diam id fermentum placerat. Aliquam efficitur felis metus, id tincidunt lacus tincidunt a. Aliquam erat volutpat. Integer nec quam at metus suscipit viverra. Pellentesque non imperdiet est. Proin suscipit justo ex, eget condimentum leo imperdiet ac. Fusce efficitur purus a convallis euismod. Integer eget nibh erat. Mauris id venenatis urna. Nullam orci lorem, sollicitudin sit amet sapien ornare, euismod lacinia lacus. Aenean vel eros sagittis, dignissim orci et, posuere nunc. Maecenas vel est elit. Nam ac dui nec justo aliquet volutpat vel eget risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer eu nisl purus. Vestibulum finibus lorem euismod, facilisis ex quis, commodo enim. Nullam placerat lobortis lacus, vitae blandit risus gravida in. Duis quis ultricies orci, non rhoncus ligula. Praesent rhoncus urna sed aliquam sodales. Nunc blandit ut quam id porta. Aliquam erat volutpat. Morbi ultrices ornare ante id dictum. Suspendisse potenti. Quisque interdum imperdiet erat. Interdum et malesuada fames ac ante ipsum primis in faucibus. Vestibulum tincidunt erat quis vestibulum venenatis. Cras vel convallis urna. Proin imperdiet odio nisi, et euismod tortor porttitor at. Pellentesque pharetra mi sed quam cursus viverra. Pellentesque tellus nisi, placerat sed nibh iaculis, viverra rutrum ligula. Fusce condimentum scelerisque lorem non efficitur. Suspendisse ac malesuada lectus. Etiam id cursus orci, ut sollicitudin augue. Morbi et metus dapibus, feugiat risus et, accumsan ligula. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin sodales et nibh at lacinia. Morbi velit tellus, ultricies ac venenatis ac, dignissim eu neque. Quisque placerat magna eget nibh porttitor, a ultricies turpis pellentesque. Phasellus fringilla egestas erat, id interdum sem imperdiet et. Duis diam lorem, feugiat at lacinia sit amet, elementum at libero. Sed vehicula eu velit ut porta. Phasellus ac fermentum urna, a viverra justo. Aliquam vel mi et libero suscipit finibus ut vel purus. Aenean id leo ut felis sollicitudin finibus id sed urna. Donec et purus purus. Morbi euismod condimentum augue, et hendrerit justo elementum et. Nulla dictum et mauris id hendrerit. Aenean non dolor lobortis, convallis metus quis, euismod felis. Curabitur et pretium nunc, a accumsan enim. Donec tempor orci vel pharetra commodo. Mauris sit amet metus porttitor, porttitor ipsum non, aliquet sapien. Proin eu pharetra dolor, sed ultricies arcu. Donec venenatis elementum nisl at varius. Ut sed scelerisque risus. Vestibulum quis leo non sapien eleifend auctor id consequat velit. Maecenas porta felis vitae velit dictum elementum. Vivamus rutrum sodales cursus. Nullam eros ante, fermentum nec nunc non, bibendum iaculis dui. Mauris enim justo, feugiat vitae massa eget, lobortis iaculis purus. Suspendisse tellus nibh, semper vitae purus sed, luctus cursus turpis. Donec id vehicula odio. Nunc non diam ac est vestibulum mattis. Phasellus mattis ipsum eu condimentum convallis. Vivamus tempor massa eu ullamcorper condimentum. Nam ultricies in mauris sit amet pellentesque. Suspendisse dui lectus, pellentesque in volutpat nec, consectetur vitae mi. Duis mi libero, laoreet at turpis vitae, rutrum commodo nulla. Maecenas viverra arcu in elit aliquet malesuada. Integer diam erat, egestas et nulla a, gravida condimentum massa. Nulla malesuada ex ut cursus viverra. In commodo lacinia libero, ac elementum lectus maximus ut. Donec eget lorem quis mi suscipit sagittis. Nunc placerat odio quis mauris iaculis, maximus rutrum est tempor. Integer sollicitudin ipsum urna, at malesuada diam accumsan quis. Praesent eu eleifend urna. Pellentesque molestie diam sit amet tristique condimentum. Aliquam fringilla et nisi vel fermentum. Vivamus elit leo, maximus in dolor ac, vestibulum commodo mi. Ut id nisi nec massa faucibus vulputate sit amet nec ligula. Integer sapien purus, bibendum in sollicitudin a, mollis a purus. Donec quis libero nisl. Mauris blandit ipsum nibh, at ultricies sapien volutpat quis. Integer nec leo efficitur, posuere nisi sed, placerat ante. Nullam malesuada nec tellus eu condimentum. Vestibulum porttitor fermentum dui, vel efficitur neque rhoncus vel. Maecenas sollicitudin gravida leo non mattis. Morbi vehicula mauris eu sagittis ullamcorper. Nam pellentesque molestie consectetur. Vivamus finibus enim justo, eu lacinia arcu iaculis et. Nullam iaculis diam sit amet velit varius, egestas rhoncus nulla venenatis. Duis at eros nibh. Sed sit amet finibus arcu. Aliquam venenatis felis sit amet odio blandit, ut faucibus tellus volutpat. Integer sit amet leo neque. Nullam ullamcorper ullamcorper turpis, vitae feugiat eros varius egestas. Morbi varius luctus augue, quis egestas eros fermentum vel. Nam semper tincidunt ornare. Sed at blandit justo, nec volutpat erat. Vivamus consequat, sapien at laoreet vulputate, urna ante pharetra libero, at faucibus lacus nunc sit amet turpis. Cras luctus diam sit amet bibendum fringilla. Nullam at erat a metus consectetur congue. Nulla accumsan nisl ac lacus vulputate iaculis. Sed interdum aliquet ligula, sit amet rutrum nisi aliquam et. Etiam faucibus at erat nec congue. Integer sed sapien ac lacus finibus pellentesque. Sed convallis erat enim, eget mattis tellus tincidunt ac. Cras nec ultricies purus, sed vestibulum est. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus sit amet nulla quis odio feugiat venenatis. Proin quis elit ante. Vestibulum nec magna quis magna bibendum dignissim. Morbi venenatis ligula et enim semper tincidunt. In hac habitasse platea dictumst. Nulla sodales arcu eu ipsum imperdiet suscipit id sed augue. Pellentesque accumsan diam purus, sed elementum orci consequat quis. Sed nec dolor quis turpis finibus fermentum. Donec imperdiet elementum leo varius fermentum. Maecenas vitae euismod leo, a euismod nunc. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque sit amet enim et libero eleifend eleifend. Quisque efficitur neque nulla, quis lobortis orci tempor et. Duis non viverra ligula. Sed elementum, ex sit amet molestie lobortis, sapien diam condimentum tortor, nec mollis mi odio ac lacus. Mauris non augue turpis. Cras venenatis faucibus augue sit amet vulputate. Pellentesque sit amet tempus nisl. Aenean ultrices neque nec ipsum malesuada tincidunt. Pellentesque iaculis mauris magna, ut ornare nulla congue sed. Nullam quis convallis leo. Donec bibendum a arcu pharetra dictum. Sed varius commodo lectus eu bibendum. Vivamus vel condimentum ligula, nec pharetra nunc. Suspendisse malesuada est in eros accumsan, nec tempus diam lacinia. Integer vel dui in ante tempor pharetra in id magna. Aliquam erat volutpat. Cras ligula est, fringilla quis egestas a, ornare at nisi. Integer cursus imperdiet libero ut eleifend. Donec mollis arcu eu lacus euismod egestas. Sed a arcu nec turpis vestibulum porta eu nec elit. Vivamus id tellus vitae lacus euismod vehicula in eget purus. Suspendisse potenti. Praesent vel lectus pulvinar, feugiat urna eu, sodales lacus. Ut sed leo in nisl vestibulum bibendum eget id velit. Donec efficitur lacus ut commodo gravida. Duis placerat, turpis eget placerat pulvinar, nisi est ultricies velit, in ullamcorper lorem odio vel lorem. Cras velit velit, cursus imperdiet suscipit sed, pretium quis purus. Cras neque est, sodales nec congue in, faucibus eget magna. Nulla feugiat, massa at blandit lacinia, tellus dui suscipit velit, id eleifend lacus diam at orci. Donec sit amet ultrices nulla. Maecenas quis sapien a libero laoreet ultrices. Curabitur et ullamcorper elit. Phasellus faucibus volutpat orci. Curabitur suscipit mattis aliquet. Etiam vehicula varius ante, sed blandit leo mattis quis. Donec eu sapien cursus lacus tempor ultricies. Proin fermentum diam id ligula aliquam varius. Vestibulum ac finibus sapien. Donec ultricies eros vel tellus porttitor cursus. Morbi auctor ipsum metus, sed malesuada orci convallis vel. Vestibulum quis leo eget quam malesuada faucibus ac eu erat. Praesent arcu eros, pulvinar non ante id, luctus sodales risus. In non arcu eget justo rutrum tempus vel sit amet nulla. Maecenas eu diam nisl. Phasellus vitae felis vehicula, pulvinar enim nec, pulvinar felis. Nullam ac justo dui. Nam lectus nibh, porttitor in lacus sit amet, hendrerit maximus orci. Integer scelerisque massa porttitor felis ultrices accumsan. Duis rhoncus lectus ut risus suscipit placerat. Morbi tristique egestas mi ac accumsan. Proin vulputate tempor dui quis congue. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam nisl ipsum, lacinia id interdum non, venenatis vel nisl. Maecenas tincidunt urna nisl, id ullamcorper ipsum placerat et. Etiam congue lacus vel justo aliquam, id sollicitudin turpis tempor. Phasellus vehicula arcu sed risus hendrerit interdum. Vivamus sit amet risus lobortis, egestas diam non, placerat tellus. In vitae diam augue. In blandit, metus sed pharetra mattis, mauris nulla consectetur eros, sit amet cursus metus mauris nec lacus. Vivamus suscipit ac elit a ultricies. Aenean accumsan sapien at lectus cursus eleifend. Sed iaculis non metus sit amet lacinia. Aliquam id sapien a sapien vehicula tincidunt. Aenean maximus venenatis nunc et lobortis. Aliquam tristique auctor sapien a sagittis. Curabitur congue tellus turpis, at lacinia ex tincidunt ultrices. Phasellus ornare vel enim non tincidunt. Sed quis odio viverra, scelerisque est a, efficitur quam. Suspendisse dictum ultricies risus, id venenatis dui pulvinar et. Pellentesque gravida ligula nisi, et elementum magna egestas ac. Sed ornare est in interdum pretium. Proin sit amet tincidunt neque. Phasellus ac lacus vitae libero finibus eleifend quis et turpis. Nullam accumsan semper tortor non ultricies. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Quisque semper urna id ligula placerat, in aliquet velit dapibus. Proin in velit velit. Donec mattis felis eros, pharetra facilisis nisl tristique vel. Praesent cursus rhoncus accumsan. Nullam egestas bibendum elit, at finibus metus sodales id. Nulla facilisi. Nam euismod sem arcu, nec vulputate dui blandit et. Integer pellentesque a velit ornare volutpat. In facilisis sodales risus a imperdiet. Vestibulum bibendum, dui et mollis dictum, quam tortor consectetur augue, id accumsan tortor arcu vitae eros. Etiam et libero tortor. Ut at nisl vitae mi iaculis convallis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris eleifend pellentesque fringilla. Mauris vel risus justo. Mauris sed molestie lacus. Mauris sagittis id arcu a fringilla. Cras eget neque sed lorem venenatis mollis non vel mi. Aenean feugiat sem non volutpat malesuada. Sed enim mi, rhoncus a imperdiet eget, feugiat cursus nisl. Donec ut auctor nibh. Mauris vitae tempor ligula, eget sagittis lacus. Sed vitae aliquet nisi. Sed porttitor ullamcorper orci, eget volutpat sem consectetur in. Nam pretium egestas pretium. Etiam eu mattis est. Ut pulvinar lectus sit amet lectus venenatis laoreet. Nullam lectus quam, scelerisque id laoreet ut, elementum et dolor. Etiam imperdiet eu magna id ornare. Ut blandit tristique tellus. Proin feugiat dolor sit amet fermentum dignissim. Vestibulum aliquam vestibulum fermentum. Nulla auctor, dolor porta hendrerit efficitur, ex turpis facilisis diam, a sollicitudin nulla ante eu risus. Nulla iaculis, mi a mattis sollicitudin, nibh lorem rhoncus felis, vel vestibulum lacus leo ut turpis. Nullam eget ipsum id metus elementum tristique non ac mi. Praesent ut pulvinar eros. Aenean id purus ipsum. In auctor tellus quis lacus imperdiet vehicula. Duis volutpat sodales maximus. Suspendisse placerat tellus tortor. Aenean bibendum erat quis enim faucibus finibus. Aenean urna risus, dapibus ac pellentesque vitae, gravida quis nibh. Ut dui augue, suscipit et purus vel, tristique condimentum dolor. Donec vestibulum iaculis posuere. Maecenas congue nulla sed faucibus porta. Proin in feugiat nisl.`.split(
    ".",
  );

describe("Query Pagination", () => {
  const total = 500;

  const tasks = new Tasks(TasksModel, { client, table });
  const tasks2 = new Tasks(makeTasksModel(), { client, table });
  const tasks3 = new Tasks(makeTasksModel(), { client, table });
  const service = new Service({ tasks, tasks2, tasks3 });

  before(async function () {
    this.timeout(20000);
    await Promise.all([tasks.load(total), tasks2.load(total)]);
    await sleep(1000);
  });

  const paginationTests = [
    {
      type: "query",
      input: {
        index: "assigned",
        key: { employee: Tasks.employees[0] },
      },
      output: tasks.filterLoaded({ employee: Tasks.employees[0] }),
    },
    {
      type: "query",
      input: {
        index: "projects",
        key: { project: Tasks.projects[0] },
      },
      output: tasks.filterLoaded({ project: Tasks.projects[0] }),
    },
    {
      type: "scan",
      output: tasks.loaded,
    },
  ];
  const limitOptions = [
    'limit',
    'count',
  ];
  for (const limitOption of limitOptions) {
    for (const test of paginationTests) {
      it(`should paginate through all records for a given query with ${limitOption}`, async () => {
        const pages = "all";
        let results = [];
        let cursor = null;
        do {
          const options = {
            cursor,
            pages,
            [limitOption]: 2
          }
          const response = test.type === "query"
            ? await tasks.query[test.input.index](test.input.key).go(options)
            : await tasks.scan.go(options);
          results = results.concat(response.data);
          cursor = response.cursor;
        } while (cursor !== null);
        expect(() => Tasks.compareTasks(results, test.output)).to.not.throw;
      }).timeout(20000);
    }

    it(`Paginate without overlapping values with ${limitOption}`, async () => {
      let limit = 30;
      let count = 0;
      let cursor = null;
      let all = [];
      let keys = new Set();
      do {
        count++;
        let [next, items] = await tasks.query
            .assigned({ employee: Tasks.employees[0] })
            .go({ cursor, [limitOption]: limit })
            .then((res) => [res.cursor, res.data]);

        if (next && count > 0) {
          const deserialized = cursorFormatter.deserialize(next);
          expect(deserialized).to.have.keys(["gsi2pk", "gsi2sk", "pk", "sk"]);
        }

        expect(items.length <= limit).to.be.true;
        for (let item of items) {
          keys.add(item.task + item.project + item.employee);
          all.push(item);
        }
        cursor = next;
      } while (cursor !== null);
      expect(all).to.have.length(keys.size);
    }).timeout(10000);

    it(`Paginate without overlapping values with pager='raw' with ${limitOption}`, async () => {
      let limit = 30;
      let count = 0;
      let cursor = null;
      let all = [];
      do {
        count++;
        let keys = new Set();
        let [next, items] = await tasks.query
            .projects({ project: Tasks.projects[0] })
            .go({ [limitOption]: limit, cursor, pager: "raw" })
            .then((res) => [res.cursor, res.data]);
        if (next !== null && count > 1) {
          expect(next).to.have.keys(["sk", "pk", "gsi1sk", "gsi1pk"]);
        }

        expect(items.length <= limit).to.be.true;
        for (let item of items) {
          keys.add(item.task + item.project + item.employee);
          all.push(item);
        }
        expect(items.length).to.equal(keys.size);
        cursor = next;
      } while (cursor !== null);
    }).timeout(10000);

    it(`should throw if '${limitOption}' option is less than one or not a valid number`, async () => {
      const employee = "employee";
      const project = "project";
      const message = limitOption === 'limit'
          ? "Error thrown by DynamoDB client: \"Limit must be greater than or equal to 1\" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error"
          : "Query option 'count' must be of type 'number' and greater than zero. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-options"
      const result1 = await service.collections
          .assignments({ employee })
          .go({ [limitOption]: -1 })
          .then(() => ({ success: true }))
          .catch((err) => ({ success: false, message: err.message }));
      expect(result1.success).to.be.false;
      expect(result1.message).to.equal(message);

      const result2 = await service.collections
          .assignments({ employee })
          .go({ [limitOption]: 0 })
          .then(() => ({ success: true }))
          .catch((err) => ({ success: false, message: err.message }));
      expect(result2.success).to.be.false;
      expect(result2.message).to.equal(message);

      const result4 = await tasks.query
          .projects({ project })
          .go({ [limitOption]: -1 })
          .then(() => ({ success: true }))
          .catch((err) => ({ success: false, message: err.message }));
      expect(result4.success).to.be.false;
      expect(result4.message).to.equal(message);

      const result5 = await tasks.query
          .projects({ project })
          .go({ [limitOption]: 0 })
          .then(() => ({ success: true }))
          .catch((err) => ({ success: false, message: err.message }));
      expect(result5.success).to.be.false;
      expect(result5.message).to.equal(message);
    });
  }

  it(`should not iterate or paginate when options.raw is supplied with limit`, async () => {
    const created = createClient();
    const tasks = new Tasks(makeTasksModel(), { client, table });
    const atLeast = 3;
    const limit = atLeast - 1;
    await tasks.load(Tasks.projects.length * atLeast);
    let project;
    let occurrences = 0;
    for (const occurrence in tasks.occurrences.projects) {
      if (occurrences < tasks.occurrences.projects[occurrence]) {
        project = occurrence;
        occurrences = tasks.occurrences.projects[occurrence];
      }
    }
    tasks.setClient(created.client);
    expect(limit).to.be.greaterThan(1);
    expect(limit).to.be.lessThan(occurrences);
    const results = await tasks.query
        .projects({ project })
        .go({ limit, data: 'raw' })
        .then((res) => res.data);
    expect(results.Items).to.be.an("array").and.have.length(limit);
    expect(created.calls).to.be.an("array").and.have.length(1);
  });

  it(`Paginate without overlapping values with raw response with limit`, async () => {
    let limit = 30;
    let count = 0;
    let cursor = null;
    let all = [];

    do {
      count++;
      let keys = new Set();
      let [next, results] = await tasks.query
          .projects({ project: Tasks.projects[0] })
          .go({ cursor, data: 'raw', limit })
          .then((res) => [res.cursor, res.data]);
      if (next !== null && count > 1) {
        expect(next).to.have.keys(["sk", "pk", "gsi1sk", "gsi1pk"]);
      }
      expect(results.Items.length <= limit).to.be.true;
      for (let item of results.Items) {
        keys.add(item.pk + item.sk);
        all.push(item);
      }
      expect(results.Items.length).to.equal(keys.size);
      cursor = next;
    } while (cursor !== null);
  }).timeout(10000);

  it(`should return exact 'count' specified`, async () => {
    const ExclusiveStartKey = { key: "hi" };
    const [one, two, three, four, five, six] = tasks.data;
    const { client, calls } = createClient({
      mockResponses: [
        {
          Items: [one, two],
          LastEvaluatedKey: ExclusiveStartKey,
        },
        {
          Items: [three],
          LastEvaluatedKey: ExclusiveStartKey,
        },
        {
          Items: [],
          LastEvaluatedKey: ExclusiveStartKey,
        },
        {
          Items: [four, five, six],
          LastEvaluatedKey: undefined,
        },
        {
          Items: [],
          LastEvaluatedKey: ExclusiveStartKey,
        },
      ],
    });
    const count = 5;
    const entity = new Tasks(TasksModel, { client, table });
    const results = await entity.query
        .task({ task: "my_task" })
        .go({ count })
        .then((res) => res.data);
    expect(results).to.be.an("array").with.length(5);
    expect(calls).to.have.length(4);
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (i === 0) {
        expect(call.ExclusiveStartKey).to.be.undefined;
      } else {
        expect(call.ExclusiveStartKey.key).to.equal("hi");
        expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be.true;
      }
    }
  });

  it(`should stop paginating when LastEvaluatedKey is no longer returned even if 'count' not yet reached`, async () => {
    const ExclusiveStartKey = { key: "hi" };
    const [one, two, three, four, five, six] = tasks.data;
    const { client, calls } = createClient({
      mockResponses: [
        {
          Items: [one, two],
          LastEvaluatedKey: ExclusiveStartKey,
        },
        {
          Items: [three],
          LastEvaluatedKey: ExclusiveStartKey,
        },
        {
          Items: [],
          LastEvaluatedKey: ExclusiveStartKey,
        },
        {
          Items: [four],
          LastEvaluatedKey: undefined,
        },
        {
          Items: [],
          LastEvaluatedKey: ExclusiveStartKey,
        },
      ],
    });
    const count = 5;
    const entity = new Tasks(TasksModel, { client, table });
    const results = await entity.query
        .task({ task: "my_task" })
        .go({ count })
        .then((res) => res.data);
    expect(results).to.be.an("array").with.length(4);
    expect(calls).to.have.length(4);
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (i === 0) {
        expect(call.ExclusiveStartKey).to.be.undefined;
      } else {
        expect(call.ExclusiveStartKey.key).to.equal("hi");
        expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be.true;
      }
    }
  });

  describe('null cursors', () => {
    const entity1 = new Entity({
      model: {
        entity: uuid(),
        version: '1',
        service: 'null-cursor',
      },
      attributes: {
        id: {
          type: 'string'
        }
      },
      indexes: {
        record: {
          collection: 'test',
          pk: {
            field: 'pk',
            composite: ['id'],
          },
          sk: {
            field: 'sk',
            composite: [],
          }
        }
      }
    }, { table, client });
    const entity2 = new Entity({
      model: {
        entity: uuid(),
        version: '1',
        service: 'null-cursor',
      },
      attributes: {
        id: {
          type: 'string'
        }
      },
      indexes: {
        record: {
          collection: 'test',
          pk: {
            field: 'pk',
            composite: ['id'],
          },
          sk: {
            field: 'sk',
            composite: [],
          }
        }
      }
    }, { table, client });

    const service = new Service({ entity1, entity2 });

    const id = uuid();
    const queries = [
      ['query operation using default execution options', () => entity1.query.record({ id }).go()],
      ['query operation with raw flag', () => entity1.query.record({ id }).go({ data: 'raw' })],
      ['query operation with includeKeys flag', () => entity1.query.record({ id }).go({ data: 'includeKeys' })],
      ['query operation with ignoreOwnership flag', () => entity1.query.record({ id }).go({ ignoreOwnership: true })],
      // ['scan query using default execution options', () => entity1.scan.go()],
      // ['scan query with raw flag', () => entity1.scan.go({ data: 'raw' })],
      // ['scan query with includeKeys flag', () => entity1.scan.go({ data: 'includeKeys' })],
      // ['scan query with ignoreOwnership flag', () => entity1.scan.go({ ignoreOwnership: true })],
      ['match query using default execution options', () => entity1.match({ id }).go()],
      ['match query with raw flag', () => entity1.match({ id }).go({ data: 'raw' })],
      ['match query with includeKeys flag', () => entity1.match({ id }).go({ data: 'includeKeys' })],
      ['match query with ignoreOwnership flag', () => entity1.match({ id }).go({ ignoreOwnership: true })],
      ['find query using default execution options', () => entity1.find({ id }).go()],
      ['find query with raw flag', () => entity1.find({ id }).go({ data: 'raw' })],
      ['find query with includeKeys flag', () => entity1.find({ id }).go({ data: 'includeKeys' })],
      ['find query with ignoreOwnership flag', () => entity1.find({ id }).go({ ignoreOwnership: true })],
      ['collection query using default execution options', () => service.collections.test({ id }).go()],
      ['collection query with raw flag', () => service.collections.test({ id }).go({ data: 'raw' })],
      ['collection query with includeKeys flag', () => service.collections.test({ id }).go({ data: 'includeKeys' })],
      ['collection query with ignoreOwnership flag', () => service.collections.test({ id }).go({ ignoreOwnership: true })],
    ];

    for (const [variation, query] of queries) {
      it(`should return a null cursor when performing ${variation}`, async () => {
        const { cursor } = await query();
        expect(cursor).to.be.null;
      });
    }
  });


  // it("Should not accept incomplete page composite attributes", async () => {
  //   let tests = [
  //     {
  //       type: "query",
  //       input: {
  //         facets: {project: Tasks.projects[0]},
  //         index: "projects",
  //         page: {task: "1234", project: undefined}
  //       },
  //       output: {
  //         error: 'Incomplete or invalid key composite attributes supplied. Missing properties: "project" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#missing-composite-attributes'
  //       },
  //     }, {
  //       type: "query",
  //       input: {
  //         facets: {employee: Tasks.employees[0]},
  //         index: "assigned",
  //         page: {task: "1234", project: "anc"}
  //       },
  //       output: {
  //         error: 'Incomplete or invalid key composite attributes supplied. Missing properties: "employee" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#missing-composite-attributes'
  //       },
  //     }, {
  //       type: "scan",
  //       input: {
  //         page: {task: "1234", project: undefined}
  //       },
  //       output: {
  //         error: 'Incomplete or invalid key composite attributes supplied. Missing properties: "project", "employee" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#missing-composite-attributes'
  //       },
  //     }
  //   ];
  //
  //   for (let test of tests) {
  //     let query = test.type === "scan"
  //         ? () => tasks.scan.go({cursor: test.input.page})
  //         : () => tasks.query[test.input.index](test.input.facets).go({cursor: test.input.page});
  //     try {
  //       await query();
  //     } catch (err) {
  //         expect(err.message).to.be.equal(test.output.error);
  //     }
  //   }
  // }).timeout(10000);

  it("Should paginate and return raw results", async () => {
    let results = await tasks.scan.go({ data: 'raw' });
    expect(results).to.have.keys(["cursor", "data"]);
    expect(results.data.Items).to.not.be.undefined;
    expect(results.data.Items).to.be.an("array");
    if (results.cursor) {
      expect(results.cursor).to.be.an("object").that.has.all.keys("pk", "sk");
    }
  }).timeout(10000);

  it("Should paginate and return normal results but the real lastEvaluated key as received via pager='raw'", async () => {
    let results = await tasks.scan
      .go({ pager: "raw" })
      .then((res) => [res.cursor, res.data]);
    expect(results).to.be.an("array").and.have.length(2);
    let [page, items] = results;
    expect(items).to.be.an("array");
    if (items[0]) {
      expect(items[0])
        .to.be.an("object")
        .that.has.all.keys(...Object.keys(TasksModel.attributes));
    }
    if (page) {
      expect(page).to.be.an("object").that.has.all.keys("pk", "sk");
    }
  }).timeout(10000);

  it("Should require a dynamodb client object to use the page method", async () => {
    let tasks = new Tasks(TasksModel);
    let { success, results } = await tasks.query
      .task({ task: "abc" })
      .go()
      .then((res) => res.data)
      .then((results) => ({ success: true, results }))
      .catch((results) => ({ success: false, results }));
    expect(success).to.be.false;
    expect(results.message).to.be.equal(
      "No client defined on model or provided in query options - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#no-client-defined-on-model",
    );
  });

  describe("query pagination", () => {
    it("query should always return string or null", async () => {
      const entity1 = new Tasks(TasksModel, { table });
      const createParams = entity1
        .create({
          task: uuid(),
          project: uuid(),
          employee: uuid(),
          points: 5,
        })
        .params();

      const ExclusiveStartKey = {
        pk: createParams.Item.pk,
        sk: createParams.Item.sk,
      };
      const { client, calls } = createClient({
        mockResponses: [
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: undefined,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
        ],
      });
      const entity = new Tasks(TasksModel, { client, table });
      let count = 0;
      let cursor;
      do {
        count++;
        const results = await entity.query
          .task({ task: "my_task" })
          .go({ cursor });
        cursor = results.cursor;
        if (typeof cursor !== "string" && cursor !== null) {
          throw new Error("Not string or null!");
        }
      } while (cursor !== null);
      expect(cursor).to.equal(null);
      expect(count).to.be.greaterThan(1);
      expect(calls).to.have.length(4);
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (i === 0) {
          expect(call.ExclusiveStartKey).to.be.undefined;
        } else {
          expect(call.ExclusiveStartKey).to.deep.equal(ExclusiveStartKey);
        }
      }
    });

    it("entity query should continue to query until LastEvaluatedKey is not returned", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client, calls } = createClient({
        mockResponses: [
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: undefined,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
        ],
      });
      const entity = new Tasks(TasksModel, { client, table });
      const results = await entity.query
        .task({ task: "my_task" })
        .go({ pages: "all" })
        .then((res) => res.data);
      expect(results).to.be.an("array").with.length(0);
      expect(calls).to.have.length(4);
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (i === 0) {
          expect(call.ExclusiveStartKey).to.be.undefined;
        } else {
          expect(call.ExclusiveStartKey.key).to.equal("hi");
          expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be
            .true;
        }
      }
    });



    it("entity query should only count entities belonging to the collection entities to fulfill 'limit' option requirements", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const [one, two, three, four, five, six] = tasks.data;
      const { client, calls } = createClient({
        mockResponses: [
          {
            Items: [{}, {}, one, two, three, {}, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [four, five, six, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: undefined,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
        ],
      });
      const pages = 'all';
      const limit = 5;
      const entity = new Tasks(TasksModel, { client, table });
      const results = await entity.query
        .task({ task: "my_task" })
        .go({ pages, limit })
        .then((res) => res.data);
      expect(results).to.be.an("array").with.length(6);
      expect(calls).to.have.length(4);
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (i === 0) {
          expect(call.ExclusiveStartKey).to.be.undefined;
        } else {
          expect(call.ExclusiveStartKey.key).to.equal("hi");
          expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be
            .true;
        }
      }
    });

    it("collection query should continue to query until LastEvaluatedKey is not returned", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client, calls } = createClient({
        mockResponses: [
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: undefined,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
        ],
      });
      const tasks = new Tasks(TasksModel, { client, table });
      const tasks2 = new Tasks(makeTasksModel(), { client, table });
      const service = new Service({ tasks, tasks2 });
      const employee = "my_employee";
      const results = await service.collections
        .assignments({ employee })
        .go({ pages: "all" })
        .then((res) => res.data);
      expect(results.tasks).to.be.an("array").with.length(0);
      expect(results.tasks2).to.be.an("array").with.length(0);
      expect(calls).to.have.length(4);
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (i === 0) {
          expect(call.ExclusiveStartKey).to.be.undefined;
        } else {
          expect(call.ExclusiveStartKey.key).to.equal("hi");
          expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be
            .true;
        }
      }
    });

    it("collection query should continue to query until 'pages' limit is reached", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client, calls } = createClient({
        mockResponses: [
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: undefined,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
        ],
      });
      const pages = 2;
      const tasks = new Tasks(TasksModel, { client, table });
      const tasks2 = new Tasks(makeTasksModel(), { client, table });
      const service = new Service({ tasks, tasks2 });
      const employee = "my_employee";
      const results = await service.collections
        .assignments({ employee })
        .go({ pages })
        .then((res) => res.data);
      expect(results.tasks).to.be.an("array").with.length(0);
      expect(results.tasks2).to.be.an("array").with.length(0);
      expect(calls).to.have.length(pages);
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (i === 0) {
          expect(call.ExclusiveStartKey).to.be.undefined;
        } else {
          expect(call.ExclusiveStartKey.key).to.equal("hi");
          expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be
            .true;
        }
      }
    });

    it(`entity query should continue to query until 'pages' limit is reached`, async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client, calls } = createClient({
        mockResponses: [
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: undefined,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
        ],
      });
      const pages = 2;
      const entity = new Tasks(TasksModel, { client, table });
      const results = await entity.query
          .task({ task: "my_task" })
          .go({ pages })
          .then((res) => res.data);
      expect(results).to.be.an("array").with.length(0);
      expect(calls).to.have.length(pages);
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (i === 0) {
          expect(call.ExclusiveStartKey).to.be.undefined;
        } else {
          expect(call.ExclusiveStartKey.key).to.equal("hi");
          expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be
              .true;
        }
      }
    });

    it("collection query should only count entities belonging to the collection entities to fulfill 'limit' option requirements", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const tasks = new Tasks(makeTasksModel(), { client, table });
      const tasks2 = new Tasks(makeTasksModel(), { client, table });

      await tasks.load(10);
      await tasks2.load(10);
      const [three, four, five, six] = tasks.data;
      const [seven, eight, nine] = tasks2.data;
      const created = createClient({
        mockResponses: [
          {
            Items: [{}, {}, three, seven, eight, nine, {}, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [four, five, six, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [],
            LastEvaluatedKey: undefined,
          },
          {
            Items: [],
            LastEvaluatedKey: ExclusiveStartKey,
          },
        ],
      });
      const service = new Service(
        { tasks, tasks2 },
        { client: created.client, table },
      );
      const pages = 'all' // 3;
      const limit = 6;
      const employee = "my_employee";
      const results = await service.collections
        .assignments({ employee })
        .go({ pages, limit })
        .then((res) => res.data);
      expect(results.tasks).to.be.an("array").with.length(4);
      expect(results.tasks2).to.be.an("array").with.length(3);
      expect(created.calls).to.have.length(4);
      for (let i = 0; i < created.calls.length; i++) {
        const call = created.calls[i];
        if (i === 0) {
          expect(call.ExclusiveStartKey).to.be.undefined;
        } else {
          expect(call.ExclusiveStartKey.key).to.equal("hi");
          expect(call.ExclusiveStartKey.key === ExclusiveStartKey.key).to.be
            .true;
        }
      }
    });

    it("should automatically paginate all results with query", async () => {
      const project = Tasks.projects[0];
      const occurrences = tasks.occurrences.projects[project];
      const overLimit = occurrences + 10;
      const underLimit = occurrences - 10;
      const results = await tasks.query
        .projects({ project })
        .go({ limit: overLimit })
        .then((res) => res.data);
      const limited = await tasks.query
        .projects({ project })
        .go({ limit: underLimit })
        .then((res) => res.data);
      const loaded = tasks.filterLoaded({ project });
      expect(() => Tasks.compareTasks(results, loaded)).to.not.throw;
      expect(results).to.have.length(occurrences);
      expect(limited).to.have.length(underLimit);
    });

    // it("should automatically paginate all results with collection", async () => {
    //   const employee = Tasks.employees[0];
    //   const limit1 = tasks.occurrences.employees[employee];
    //   const limit2 = tasks2.occurrences.employees[employee];
    //   const limit3 = tasks3.occurrences.employees[employee];
    //   const overLimit = limit1 + limit2 + limit3 + 10;
    //   const underLimit = limit1 + limit2 + limit3 - 10;
    //   let queryCount = 0;
    //   let underQueryResults = [];
    //   let queryCounter = (event) => {
    //     if (event.type === 'query') {
    //       queryCount = queryCount + 1;
    //       underQueryResults = underQueryResults.concat(event.results.Items);
    //     }
    //   }
    //   const results = await service.collections.assignments({employee}).go({limit: overLimit}).then(res => res.data);
    //   const limited = await service.collections.assignments({employee}).go({limit: underLimit, listeners: [queryCounter]}).then(res => res.data);
    //   const tasks1Loaded = tasks.filterLoaded({employee});
    //   const tasks2Loaded = tasks2.filterLoaded({employee});
    //   const tasks3Loaded = tasks3.filterLoaded({employee});
    //   expect(() => Tasks.compareTasks(results.tasks, tasks1Loaded)).to.not.throw;
    //   expect(() => Tasks.compareTasks(results.tasks2, tasks2Loaded)).to.not.throw;
    //   expect(() => Tasks.compareTasks(results.tasks3, tasks3Loaded)).to.not.throw;
    //   expect(results.tasks).to.have.length(tasks.occurrences.employees[employee]);
    //   expect(results.tasks2).to.have.length(tasks2.occurrences.employees[employee]);
    //   expect(results.tasks3).to.have.length(tasks3.occurrences.employees[employee]);
    //   const resultSize = Object.values(limited).map(items => items.length).reduce((total, length) => total + length, 0);
    //   if (resultSize < underLimit && queryCount === 2) {
    //     expect(resultSize).to.equal(underQueryResults.length);
    //   } else {
    //     expect(resultSize).to.equal(underLimit);
    //   }
    // });

    it("should only iterate through the specified number of pages for entity queries", async () => {
      const employee = Tasks.employees[0];
      const occurrences = tasks.occurrences.employees[employee];
      const pages = 2;
      const limit = Math.floor(occurrences / 4);
      const results = await tasks.query
        .assigned({ employee })
        .go({ pages, params: { Limit: limit } })
        .then((res) => res.data);
      expect(limit).to.be.greaterThan(0);
      expect(occurrences).to.be.greaterThan(limit * pages);
      expect(results).to.have.length(limit * pages);
    });

    // it("should only iterate through the specified number of pages for collections", async () => {
    //   const employee = Tasks.employees[0];
    //   const occurrences1 = tasks.occurrences.employees[employee];
    //   const occurrences2 = tasks2.occurrences.employees[employee];
    //   const occurrences3 = tasks3.occurrences.employees[employee];
    //   const limit = [ occurrences1, occurrences2 ]
    //       .filter(occurrence => occurrence !== 0)
    //       .map((occurrence) => Math.floor(occurrence / 4))
    //       .reduce((min, val) => Math.min(min, val), Number.MAX_VALUE);
    //   const pages = 2;
    //   expect(limit).to.be.greaterThan(0);
    //   expect(occurrences1).to.be.greaterThan(limit * pages);
    //   expect(occurrences2).to.be.greaterThan(limit * pages);
    //   let queryCount = 0;
    //   let items = [];
    //   let queryCounter = (event) => {
    //     if (event.type === 'query') {
    //       queryCount = queryCount + 1;
    //       items = items.concat(event.results.Items);
    //     }
    //   }
    //   const results = await service.collections.assignments({employee}).go({pages, params: {Limit: limit}, listeners: [queryCounter]}).then(res => res.data);
    //   const total = Object.values(results).map(result => result.length).reduce((total, length) => total + length, 0);
    //   if (total < limit * pages && queryCount === 2) {
    //     expect(total).to.equal(items.length);
    //   } else {
    //     expect(total).to.equal(limit * pages);
    //   }
    // });

    it("should throw if 'pages' option is less than one or not a valid number", async () => {
      const employee = "employee";
      const project = "project";
      const message =
        "Query option 'pages' must be of type 'number' and greater than zero or the string value 'all' - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-pages-option";
      const result1 = await service.collections
        .assignments({ employee })
        .go({ pages: -1 })
        .then(() => ({ success: true }))
        .catch((err) => ({ success: false, message: err.message }));
      expect(result1.success).to.be.false;
      expect(result1.message).to.equal(message);

      const result2 = await service.collections
        .assignments({ employee })
        .go({ pages: 0 })
        .then(() => ({ success: true }))
        .catch((err) => ({ success: false, message: err.message }));
      expect(result2.success).to.be.false;
      expect(result2.message).to.equal(message);

      const result3 = await service.collections
        .assignments({ employee })
        .go({ pages: "weasel" })
        .then(() => ({ success: true }))
        .catch((err) => ({ success: false, message: err.message }));
      expect(result3.success).to.be.false;
      expect(result3.message).to.equal(message);

      const result4 = await tasks.query
        .projects({ project })
        .go({ pages: -1 })
        .then(() => ({ success: true }))
        .catch((err) => ({ success: false, message: err.message }));
      expect(result4.success).to.be.false;
      expect(result4.message).to.equal(message);

      const result5 = await tasks.query
        .projects({ project })
        .go({ pages: 0 })
        .then(() => ({ success: true }))
        .catch((err) => ({ success: false, message: err.message }));
      expect(result5.success).to.be.false;
      expect(result5.message).to.equal(message);

      const result6 = await tasks.query
        .projects({ project })
        .go({ pages: "weasel" })
        .then(() => ({ success: true }))
        .catch((err) => ({ success: false, message: err.message }));
      expect(result6.success).to.be.false;
      expect(result6.message).to.equal(message);
    });

    it("should return the response received by options.parse if value is not array", async () => {
      let wasParsed = false;
      let parseArgs = {};
      const parserResponse = { value: 12345 };
      const project = Tasks.projects[0];
      const limit = 1;
      const results = await tasks.query.projects({ project }).go({
        limit,
        parse: (config, response) => {
          wasParsed = true;
          parseArgs = response;
          return parserResponse;
        },
      });
      expect(wasParsed).to.be.true;
      expect(results.data === parserResponse).to.be.true;
      expect(parseArgs.Items).to.be.an("array");
      expect(parseArgs.LastEvaluatedKey).to.have.keys(
        "pk",
        "sk",
        "gsi1sk",
        "gsi1pk",
      );
      expect(parseArgs.Count).to.equal(1);
      expect(parseArgs.ScannedCount).to.equal(1);
    });

    it("should not clobber a user defined ExclusiveStartKey", async () => {
      const { client, calls } = createClient({
        mockResponses: [
          {
            Items: [],
          },
        ],
      });
      const task = "my_task";
      const tasks = new Entity(makeTasksModel(), { client, table });
      const key = {
        pk: "$taskapp#task_72e9aa8c-7b3b-4ee6-8274-9e82ca8c8850",
        sk: "$d44fcdf8-868d-4ba5-a64b-9ebfa6ef6b47_1#project_372-55#employee_ronda",
      };
      await tasks.query
        .task({ task })
        .go({
          params: {
            ExclusiveStartKey: key,
          },
        })
        .then((res) => res.data);
      expect(calls).to.be.an("array").and.have.length(1);
      expect(calls[0].ExclusiveStartKey === key).to.be.true;
    });
  });
});