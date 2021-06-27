process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const AWS = require("aws-sdk");
const uuid = require("uuid").v4;
const {expect} = require("chai");
const {Entity} = require("../");
const endpoint = process.env.LOCAL_DYNAMO_ENDPOINT;
const region = "us-east-1";
const isLocal = endpoint !== undefined;
AWS.config.update({region, endpoint});
const client = new AWS.DynamoDB.DocumentClient();
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TasksModel = {
  entity: uuid(),
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
        facets: ["project", "points"],
      },
    },
  },
};

class Tasks extends Entity {
  constructor(model, {client} = {}) {
    super(model, {client});
    this.name = model.entity
    this.loaded = [];
  }


  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
  }

  generateRandomComments() {
    let comments = [];
    for (let i = 0; i < this.getRandomNumber(2, 6); i++) {
      let text = [];
      for (let j = 0; j < this.getRandomNumber(4, 10); j++) {
        text.push(Tasks.sentences[this.getRandomNumber(0, Tasks.sentences.length)]);
      }
      comments.push({
        author: Tasks.employees[this.getRandomNumber(0, Tasks.employees.length)],
        text: text.join(".") + "."
      })
    }
    return comments;
  }

  generateRandomRecord() {
    return {
      employee: Tasks.employees[this.getRandomNumber(0, Tasks.employees.length)],
      project: Tasks.projects[this.getRandomNumber(0, Tasks.projects.length)],
      type: Tasks.types[this.getRandomNumber(0, Tasks.types.length)],
      points: Tasks.points[this.getRandomNumber(0, Tasks.points.length)],
      description: Tasks.sentences[this.getRandomNumber(0, Tasks.sentences.length)],
      comments: this.generateRandomComments()
    }
  }

  static deepCopy(o) {
    return JSON.parse(JSON.stringify(o));
  }

  static compareTasks(tasksOne = [], tasksTwo = []) {
    if (tasksOne.length !== tasksTwo.length) {
      throw new Error("Tasks not the same length");
    }
    tasksOne = Tasks.deepCopy(tasksOne).sort((a, z) => (a.pk + a.sk) - (z.pk + z.sk));
    tasksTwo = Tasks.deepCopy(tasksOne).sort((a, z) => (a.pk + a.sk) - (z.pk + z.sk));
    for (let i = 0; i < tasksOne.length; i++) {
      let pkMatch = tasksOne[i].pk = tasksTwo[i].pk;
      let skMatch = tasksOne[i].sk = tasksTwo[i].sk;
      if (!pkMatch) {
        throw new Error(`No PK Match, tasksOne: ${tasksOne[i].pk}, tasksTwo: ${tasksTwo[i].pk}`);
      }
      if (!skMatch) {
        throw new Error(`No SK Match, tasksOne: ${tasksOne[i].sk}, tasksTwo: ${tasksTwo[i].sk}`);
      }
    }
  }

  async load(n = 0) {
    let inserts = [];
    for (let i = 0; i < n; i++) {
      let randomRecord = this.generateRandomRecord();
      this.loaded.push(randomRecord);
      inserts.push(this.put(randomRecord).go())
    }
    return Promise.all(inserts)
  }

  async paginate(limit, pages, query, test = (data) => data) {
    var next;
    let results = [];
    for (let i = 0; i < pages; i++) {
      if (next === null) {
        break;
      }
      var [next, tasks] = await query(next, limit).then(test);
      results = [...results, ...tasks];
    }
    return results
  }

  filterLoaded(facets = {}) {
    return Tasks.deepCopy(this.loaded.filter(record => {
      for (let facet of Object.keys(facets)) {
        if (record[facet] !== facets[facet]) {
          return false
        }
      }
      return true;
    }));
  };
}

Tasks.employees = [
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
]

Tasks.projects =[
  "135-53",
  "460-63",
  "372-55",
  "552-77",
  "636-33",
  "360-56"
];

Tasks.types = ["story", "defect", "epic"];

Tasks.points = [1, 2, 3, 5, 8, 13, 21, 50, 100];

Tasks.sentences = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum condimentum eros ut auctor cursus. Vivamus ac malesuada purus. Phasellus scelerisque tellus non nisi tempus, eget sagittis metus tempus. Mauris eu sapien non magna vulputate lobortis. Maecenas posuere enim et dolor ultrices, et tempus ligula scelerisque. Mauris vehicula turpis nec mi blandit convallis. Curabitur lacinia quis eros in blandit. Aliquam sed mauris auctor, tincidunt risus sed, fringilla turpis. Vestibulum molestie nec mauris vel sollicitudin. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Integer vitae orci sem. Vivamus finibus molestie lectus vel tempus. Curabitur rutrum, mauris sit amet blandit imperdiet, nibh purus molestie diam, sit amet maximus odio quam lacinia nisi. Proin laoreet dictum auctor. Mauris placerat commodo nisl in condimentum. Pellentesque non magna diam. Quisque in varius metus. Aenean lorem tellus, gravida nec egestas eu, rutrum id lectus. Ut id lacus leo. Donec dignissim id eros vitae auctor. Nunc tincidunt diam id fermentum placerat. Aliquam efficitur felis metus, id tincidunt lacus tincidunt a. Aliquam erat volutpat. Integer nec quam at metus suscipit viverra. Pellentesque non imperdiet est. Proin suscipit justo ex, eget condimentum leo imperdiet ac. Fusce efficitur purus a convallis euismod. Integer eget nibh erat. Mauris id venenatis urna. Nullam orci lorem, sollicitudin sit amet sapien ornare, euismod lacinia lacus. Aenean vel eros sagittis, dignissim orci et, posuere nunc. Maecenas vel est elit. Nam ac dui nec justo aliquet volutpat vel eget risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer eu nisl purus. Vestibulum finibus lorem euismod, facilisis ex quis, commodo enim. Nullam placerat lobortis lacus, vitae blandit risus gravida in. Duis quis ultricies orci, non rhoncus ligula. Praesent rhoncus urna sed aliquam sodales. Nunc blandit ut quam id porta. Aliquam erat volutpat. Morbi ultrices ornare ante id dictum. Suspendisse potenti. Quisque interdum imperdiet erat. Interdum et malesuada fames ac ante ipsum primis in faucibus. Vestibulum tincidunt erat quis vestibulum venenatis. Cras vel convallis urna. Proin imperdiet odio nisi, et euismod tortor porttitor at. Pellentesque pharetra mi sed quam cursus viverra. Pellentesque tellus nisi, placerat sed nibh iaculis, viverra rutrum ligula. Fusce condimentum scelerisque lorem non efficitur. Suspendisse ac malesuada lectus. Etiam id cursus orci, ut sollicitudin augue. Morbi et metus dapibus, feugiat risus et, accumsan ligula. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin sodales et nibh at lacinia. Morbi velit tellus, ultricies ac venenatis ac, dignissim eu neque. Quisque placerat magna eget nibh porttitor, a ultricies turpis pellentesque. Phasellus fringilla egestas erat, id interdum sem imperdiet et. Duis diam lorem, feugiat at lacinia sit amet, elementum at libero. Sed vehicula eu velit ut porta. Phasellus ac fermentum urna, a viverra justo. Aliquam vel mi et libero suscipit finibus ut vel purus. Aenean id leo ut felis sollicitudin finibus id sed urna. Donec et purus purus. Morbi euismod condimentum augue, et hendrerit justo elementum et. Nulla dictum et mauris id hendrerit. Aenean non dolor lobortis, convallis metus quis, euismod felis. Curabitur et pretium nunc, a accumsan enim. Donec tempor orci vel pharetra commodo. Mauris sit amet metus porttitor, porttitor ipsum non, aliquet sapien. Proin eu pharetra dolor, sed ultricies arcu. Donec venenatis elementum nisl at varius. Ut sed scelerisque risus. Vestibulum quis leo non sapien eleifend auctor id consequat velit. Maecenas porta felis vitae velit dictum elementum. Vivamus rutrum sodales cursus. Nullam eros ante, fermentum nec nunc non, bibendum iaculis dui. Mauris enim justo, feugiat vitae massa eget, lobortis iaculis purus. Suspendisse tellus nibh, semper vitae purus sed, luctus cursus turpis. Donec id vehicula odio. Nunc non diam ac est vestibulum mattis. Phasellus mattis ipsum eu condimentum convallis. Vivamus tempor massa eu ullamcorper condimentum. Nam ultricies in mauris sit amet pellentesque. Suspendisse dui lectus, pellentesque in volutpat nec, consectetur vitae mi. Duis mi libero, laoreet at turpis vitae, rutrum commodo nulla. Maecenas viverra arcu in elit aliquet malesuada. Integer diam erat, egestas et nulla a, gravida condimentum massa. Nulla malesuada ex ut cursus viverra. In commodo lacinia libero, ac elementum lectus maximus ut. Donec eget lorem quis mi suscipit sagittis. Nunc placerat odio quis mauris iaculis, maximus rutrum est tempor. Integer sollicitudin ipsum urna, at malesuada diam accumsan quis. Praesent eu eleifend urna. Pellentesque molestie diam sit amet tristique condimentum. Aliquam fringilla et nisi vel fermentum. Vivamus elit leo, maximus in dolor ac, vestibulum commodo mi. Ut id nisi nec massa faucibus vulputate sit amet nec ligula. Integer sapien purus, bibendum in sollicitudin a, mollis a purus. Donec quis libero nisl. Mauris blandit ipsum nibh, at ultricies sapien volutpat quis. Integer nec leo efficitur, posuere nisi sed, placerat ante. Nullam malesuada nec tellus eu condimentum. Vestibulum porttitor fermentum dui, vel efficitur neque rhoncus vel. Maecenas sollicitudin gravida leo non mattis. Morbi vehicula mauris eu sagittis ullamcorper. Nam pellentesque molestie consectetur. Vivamus finibus enim justo, eu lacinia arcu iaculis et. Nullam iaculis diam sit amet velit varius, egestas rhoncus nulla venenatis. Duis at eros nibh. Sed sit amet finibus arcu. Aliquam venenatis felis sit amet odio blandit, ut faucibus tellus volutpat. Integer sit amet leo neque. Nullam ullamcorper ullamcorper turpis, vitae feugiat eros varius egestas. Morbi varius luctus augue, quis egestas eros fermentum vel. Nam semper tincidunt ornare. Sed at blandit justo, nec volutpat erat. Vivamus consequat, sapien at laoreet vulputate, urna ante pharetra libero, at faucibus lacus nunc sit amet turpis. Cras luctus diam sit amet bibendum fringilla. Nullam at erat a metus consectetur congue. Nulla accumsan nisl ac lacus vulputate iaculis. Sed interdum aliquet ligula, sit amet rutrum nisi aliquam et. Etiam faucibus at erat nec congue. Integer sed sapien ac lacus finibus pellentesque. Sed convallis erat enim, eget mattis tellus tincidunt ac. Cras nec ultricies purus, sed vestibulum est. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus sit amet nulla quis odio feugiat venenatis. Proin quis elit ante. Vestibulum nec magna quis magna bibendum dignissim. Morbi venenatis ligula et enim semper tincidunt. In hac habitasse platea dictumst. Nulla sodales arcu eu ipsum imperdiet suscipit id sed augue. Pellentesque accumsan diam purus, sed elementum orci consequat quis. Sed nec dolor quis turpis finibus fermentum. Donec imperdiet elementum leo varius fermentum. Maecenas vitae euismod leo, a euismod nunc. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque sit amet enim et libero eleifend eleifend. Quisque efficitur neque nulla, quis lobortis orci tempor et. Duis non viverra ligula. Sed elementum, ex sit amet molestie lobortis, sapien diam condimentum tortor, nec mollis mi odio ac lacus. Mauris non augue turpis. Cras venenatis faucibus augue sit amet vulputate. Pellentesque sit amet tempus nisl. Aenean ultrices neque nec ipsum malesuada tincidunt. Pellentesque iaculis mauris magna, ut ornare nulla congue sed. Nullam quis convallis leo. Donec bibendum a arcu pharetra dictum. Sed varius commodo lectus eu bibendum. Vivamus vel condimentum ligula, nec pharetra nunc. Suspendisse malesuada est in eros accumsan, nec tempus diam lacinia. Integer vel dui in ante tempor pharetra in id magna. Aliquam erat volutpat. Cras ligula est, fringilla quis egestas a, ornare at nisi. Integer cursus imperdiet libero ut eleifend. Donec mollis arcu eu lacus euismod egestas. Sed a arcu nec turpis vestibulum porta eu nec elit. Vivamus id tellus vitae lacus euismod vehicula in eget purus. Suspendisse potenti. Praesent vel lectus pulvinar, feugiat urna eu, sodales lacus. Ut sed leo in nisl vestibulum bibendum eget id velit. Donec efficitur lacus ut commodo gravida. Duis placerat, turpis eget placerat pulvinar, nisi est ultricies velit, in ullamcorper lorem odio vel lorem. Cras velit velit, cursus imperdiet suscipit sed, pretium quis purus. Cras neque est, sodales nec congue in, faucibus eget magna. Nulla feugiat, massa at blandit lacinia, tellus dui suscipit velit, id eleifend lacus diam at orci. Donec sit amet ultrices nulla. Maecenas quis sapien a libero laoreet ultrices. Curabitur et ullamcorper elit. Phasellus faucibus volutpat orci. Curabitur suscipit mattis aliquet. Etiam vehicula varius ante, sed blandit leo mattis quis. Donec eu sapien cursus lacus tempor ultricies. Proin fermentum diam id ligula aliquam varius. Vestibulum ac finibus sapien. Donec ultricies eros vel tellus porttitor cursus. Morbi auctor ipsum metus, sed malesuada orci convallis vel. Vestibulum quis leo eget quam malesuada faucibus ac eu erat. Praesent arcu eros, pulvinar non ante id, luctus sodales risus. In non arcu eget justo rutrum tempus vel sit amet nulla. Maecenas eu diam nisl. Phasellus vitae felis vehicula, pulvinar enim nec, pulvinar felis. Nullam ac justo dui. Nam lectus nibh, porttitor in lacus sit amet, hendrerit maximus orci. Integer scelerisque massa porttitor felis ultrices accumsan. Duis rhoncus lectus ut risus suscipit placerat. Morbi tristique egestas mi ac accumsan. Proin vulputate tempor dui quis congue. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam nisl ipsum, lacinia id interdum non, venenatis vel nisl. Maecenas tincidunt urna nisl, id ullamcorper ipsum placerat et. Etiam congue lacus vel justo aliquam, id sollicitudin turpis tempor. Phasellus vehicula arcu sed risus hendrerit interdum. Vivamus sit amet risus lobortis, egestas diam non, placerat tellus. In vitae diam augue. In blandit, metus sed pharetra mattis, mauris nulla consectetur eros, sit amet cursus metus mauris nec lacus. Vivamus suscipit ac elit a ultricies. Aenean accumsan sapien at lectus cursus eleifend. Sed iaculis non metus sit amet lacinia. Aliquam id sapien a sapien vehicula tincidunt. Aenean maximus venenatis nunc et lobortis. Aliquam tristique auctor sapien a sagittis. Curabitur congue tellus turpis, at lacinia ex tincidunt ultrices. Phasellus ornare vel enim non tincidunt. Sed quis odio viverra, scelerisque est a, efficitur quam. Suspendisse dictum ultricies risus, id venenatis dui pulvinar et. Pellentesque gravida ligula nisi, et elementum magna egestas ac. Sed ornare est in interdum pretium. Proin sit amet tincidunt neque. Phasellus ac lacus vitae libero finibus eleifend quis et turpis. Nullam accumsan semper tortor non ultricies. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Quisque semper urna id ligula placerat, in aliquet velit dapibus. Proin in velit velit. Donec mattis felis eros, pharetra facilisis nisl tristique vel. Praesent cursus rhoncus accumsan. Nullam egestas bibendum elit, at finibus metus sodales id. Nulla facilisi. Nam euismod sem arcu, nec vulputate dui blandit et. Integer pellentesque a velit ornare volutpat. In facilisis sodales risus a imperdiet. Vestibulum bibendum, dui et mollis dictum, quam tortor consectetur augue, id accumsan tortor arcu vitae eros. Etiam et libero tortor. Ut at nisl vitae mi iaculis convallis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris eleifend pellentesque fringilla. Mauris vel risus justo. Mauris sed molestie lacus. Mauris sagittis id arcu a fringilla. Cras eget neque sed lorem venenatis mollis non vel mi. Aenean feugiat sem non volutpat malesuada. Sed enim mi, rhoncus a imperdiet eget, feugiat cursus nisl. Donec ut auctor nibh. Mauris vitae tempor ligula, eget sagittis lacus. Sed vitae aliquet nisi. Sed porttitor ullamcorper orci, eget volutpat sem consectetur in. Nam pretium egestas pretium. Etiam eu mattis est. Ut pulvinar lectus sit amet lectus venenatis laoreet. Nullam lectus quam, scelerisque id laoreet ut, elementum et dolor. Etiam imperdiet eu magna id ornare. Ut blandit tristique tellus. Proin feugiat dolor sit amet fermentum dignissim. Vestibulum aliquam vestibulum fermentum. Nulla auctor, dolor porta hendrerit efficitur, ex turpis facilisis diam, a sollicitudin nulla ante eu risus. Nulla iaculis, mi a mattis sollicitudin, nibh lorem rhoncus felis, vel vestibulum lacus leo ut turpis. Nullam eget ipsum id metus elementum tristique non ac mi. Praesent ut pulvinar eros. Aenean id purus ipsum. In auctor tellus quis lacus imperdiet vehicula. Duis volutpat sodales maximus. Suspendisse placerat tellus tortor. Aenean bibendum erat quis enim faucibus finibus. Aenean urna risus, dapibus ac pellentesque vitae, gravida quis nibh. Ut dui augue, suscipit et purus vel, tristique condimentum dolor. Donec vestibulum iaculis posuere. Maecenas congue nulla sed faucibus porta. Proin in feugiat nisl.`.split(".")

describe("Page", async () => {
  const total = isLocal ? 500 : 20;
  const tasks = new Tasks(TasksModel, {client});

  before(async function() {
    this.timeout(10000);
    await tasks.load(total);
    await sleep(1000);
  });

  it("Should paginate through all records", async () => {
    let tests = [
      {
        type: "query",
        input: {
          facets: {project: Tasks.projects[0]},
          index: "projects",
        },
        output: {
          pageKeys: ["task", "project", "employee"]
        },
      }, {
        type: "query",
        input: {
          facets: {employee: Tasks.employees[0]},
          index: "assigned",
        },
        output: {
          pageKeys: ["points", "project", "employee"]
        },
      }, {
        type: "scan",
        output: {
          pageKeys: ["task", "project", "employee"]
        },
      }
    ];
    for (let test of tests) {
      let query;
      let loaded;
      let testPage = (([page, tasks]) => {
        if (page !== null) expect(page).to.include.keys(test.output.pageKeys);
        return [page, tasks];
      });
      if (test.type === "scan") {
        query = (next, limit) => tasks.scan.page(next, {limit});
        loaded = tasks.loaded;
      } else {
        query = (next, limit) => tasks.query[test.input.index](test.input.facets).page(next, {limit});
        loaded = tasks.filterLoaded(test.input.facets);
      }
      
      let results = await tasks.paginate(2, total, query, testPage);
      expect(() => Tasks.compareTasks(results, loaded)).to.not.throw;
    }
  }).timeout(10000);

  it("Paginate without overlapping values", async () => {
    let limit = 30;
    let count = 0;
    let page = null;
    let all = [];
    let keys = new Set();
    do {
      count++;
      let [next, items] = await tasks.query.assigned({employee: Tasks.employees[0]}).page(page, {limit});
      if (next && count > 0) {
        expect(next).to.have.keys(["project", "points", "employee", "task", "__edb_e__", "__edb_v__"]);
      }
      expect(items.length <= limit).to.be.true;
      for (let item of items) {
        keys.add(item.task + item.project + item.employee);
        all.push(item);
      }
      page = next;
    } while(page !== null);
    expect(all).to.have.length(keys.size);
  }).timeout(10000);

  it("Paginate without overlapping values with raw response", async () => {
    let limit = 30;
    let count = 0;
    let page = null;
    let all = [];

    do {
      count++;
      let keys = new Set();
      let [next, results] = await tasks.query.projects({project: Tasks.projects[0]}).page(page, {limit, raw: true});
      if (next !== null && count > 1) {
        expect(next).to.have.keys(["sk", "pk", "gsi1sk", "gsi1pk"]);
      }
      expect(results.Items.length <= limit).to.be.true;
      for (let item of results.Items) {
        keys.add(item.pk + item.sk);
        all.push(item);
      }
      if (results.Items.length !== keys.size) {
        console.log({items: results.Items, keys});
      }
      expect(results.Items.length).to.equal(keys.size);
      page = next;
    } while(page !== null);
  }).timeout(10000);

  it("Paginate without overlapping values with pager='raw'", async () => {
    let limit = 30;
    let count = 0;
    let page = null;
    let all = [];

    do {
      count++;
      let keys = new Set();
      let [next, items] = await tasks.query.projects({project: Tasks.projects[0]}).page(page, {limit, pager: "raw"});
      if (next !== null && count > 1) {
        expect(next).to.have.keys(["sk", "pk", "gsi1sk", "gsi1pk"]);
      }
      expect(items.length <= limit).to.be.true;
      for (let item of items) {
        keys.add(item.task + item.project + item.employee);
        all.push(item);
      }
      if (items.length !== keys.size) {
        console.log({items: items, keys});
      }
      expect(items.length).to.equal(keys.size);
      page = next;
    } while(page !== null);
  }).timeout(10000);

  it("Should not accept incomplete page composite attributes", async () => {
    let tests = [
      {
        type: "query",
        input: {
          facets: {project: Tasks.projects[0]},
          index: "projects",
          page: {task: "1234", project: undefined}
        },
        output: {
          error: 'Incomplete or invalid key composite attributes supplied. Missing properties: "project" - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes'
        },
      }, {
        type: "query",
        input: {
          facets: {employee: Tasks.employees[0]},
          index: "assigned",
          page: {task: "1234", project: "anc"}
        },
        output: {
          error: 'Incomplete or invalid key composite attributes supplied. Missing properties: "employee" - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes'
        },
      }, {
        type: "scan",
        input: {
          page: {task: "1234", project: undefined}
        },
        output: {
          error: 'Incomplete or invalid key composite attributes supplied. Missing properties: "project", "employee" - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes'
        },
      }
    ];

    for (let test of tests) {
      let query = test.type === "scan"
          ? () => tasks.scan.page(test.input.page)
          : () => tasks.query[test.input.index](test.input.facets).page(test.input.page);
      try {
        await query();
      } catch (err) {
          expect(err.message).to.be.equal(test.output.error);
      }
    }
  }).timeout(10000);

  it("Should paginate and return raw results", async () => {
    let results = await tasks.scan.page(null, {raw: true});
    expect(results).to.be.an("array").and.have.length(2);
    let [page, items] = results;
    expect(items.Items).to.not.be.undefined
    expect(items.Items).to.be.an("array");
    if (page) {
      expect(page).to.be.an('object').that.has.all.keys('pk', 'sk');
    }
  }).timeout(10000);

  it("Should paginate and return normal results but the real lastEvaluated key as received via pager='raw'", async () => {
    let results = await tasks.scan.page(null, {pager: "raw"});
    expect(results).to.be.an("array").and.have.length(2);
    let [page, items] = results;
    expect(items).to.be.an("array");
    if (items[0]) {
      expect(items[0]).to.be.an('object').that.has.all.keys(...Object.keys(TasksModel.attributes));
    }
    if (page) {
      expect(page).to.be.an('object').that.has.all.keys('pk', 'sk');
    }
  }).timeout(10000);

  it("Should require a dynamodb client object to use the page method", async () => {
    let tasks = new Tasks(TasksModel);
    let {success, results} = await tasks.query
        .task({task: "abc"})
        .page()
        .then(results => ({success: true, results}))
        .catch(results => ({success: false, results}));
    expect(success).to.be.false;
    expect(results.message).to.be.equal("No client defined on model - For more detail on this error reference: https://github.com/tywalch/electrodb#no-client-defined-on-model")
  });
});

// describe("Collection Pagination")
