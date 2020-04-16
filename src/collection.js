let { Entity } = require("./entity");

class Service {
	constructor(name = "", config = {}) {
		let { table, version } = config;
		this.service = {
			name,
			table,
			version,
		};
		this._collections = [];
		this.entities = {};
	}
	relate(name = "", fn = (service = {}) => ({})) {
		let model = fn(this) || {};
		model.service = this.service.name;
		model.table = this.service.table;
		model.version = this.service.version;
		model.entity = name;
		let entity = new Entity(model);
		for (let collection of entity.collections) {
			this._collections[collection] = this._collections[collection] || [];
			this._collections[collection].push(entity);
		}
		this.entities[name] = entity;
	}
}
