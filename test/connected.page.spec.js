process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity, Service } = require("../src/entity");
const { expect } = require("chai");
const uuidv4 = require("uuid").v4;
const moment = require("moment");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

let zoos = {
  entity: "zoos",
  attributes: {
    name: {
      type: "string"
    },
    state: {
      type: "string",
    },
    city: {
      type: "string"
    }
  },
  indexes: {
    locations: {
      pk: {
        field: "pk",
        facets: ["state", "city"]
      },
      sk: {
        field: "sk",
        facets: ["name"]
      }
    },
    zoo: {
      index: "gsi1pk-gsi1sk-index",
      collection: "zoos",
      pk: {
        field: "pk",
        facets: ["name"]
      },
      sk: {
        field: "sk",
        facets: ["state", "city"]
      }
    }
  }
}

let animals = {
  entity: "animals",
  attributes: {
    species: {
      type: "string",
    },
    name: {
      type: "string",
    },
    zoo: {
      type: "string",
    },
    habitat: {
      type: ["ocean", "safari", "plains", "arctic", "rainforest"]
    },
    diet: {
      type: ["herbivore", "carnivore"]
    }
  },
  indexes: {
    kinds: {
      pk: {
        field: "pk",
        facets: ["species"]
      },
      sk: {
        field: "sk",
        facets: ["zoo", "name"]
      }
    },
    zoo: {
      index: "gsi1pk-gsi1sk-index",
      collection: "zoos",
      pk: {
        field: "gsi1pk",
        facets: ["zoo"]
      },
      sk: {
        field: "gsi1sk",
        facets: ["species", "name"]
      }
    },
    habitats: {
      index: "gsi2pk-gsi2sk-index",
      collection: "zoos",
      pk: {
        field: "gsi2pk",
        facets: ["habitat"]
      },
      sk: {
        field: "gsi2sk",
        facets: ["species", "name", "zoo"]
      }
    },
    critter: {
      index: "gsi3pk-gsi3sk-index",
      collection: "zoos",
      pk: {
        field: "gsi3pk",
        facets: ["name", "zoo"]
      },
      sk: {
        field: "gsi3sk",
        facets: ["species"]
      }
    }
  }
}

let zookeepers = {
  entity: "zookeepers",
  attributes: {
    name: {
      type: "string"
    },
    zoo: {
      type: "string",
    },
    role: {
      type: ["feeder", "cleaner", "clipboard"]
    },
  },
  indexes: {
    keepers: {
      pk: {
        field: "pk",
        facets: ["name"]
      },
      sk: {
        field: "sk",
        facets: ["zoo"]
      }
    },
    favorites: {
      index: "gsi1pk-gsi1sk-index",
      collection: "zoos",
      pk: {
        field: "pk",
        facets: ["name"]
      },
      sk: {
        field: "sk",
        facets: ["city", "state"]
      }
    }
  }
}