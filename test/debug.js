const {Entity} = require("../index");
const moment = require("moment");
const uuidV4 = require("uuid/v4");

let model = {  
	service: "MallStoreDirectory",  
	entity: "MallStore",  
	table: "StoreDirectory",  
	version: "1",  
	attributes: {  
		mallId: {  
			type: "string",  
			required: true,  
		},  
		storeId: {  
			type: "string",  
			required: true,  
		},  
		buildingId: {  
			type: "string",  
			required: true,  
		},  
		unitId: {  
		    type: "string",  
			required: true,
		},  
		category: {  
		    type: [
			    "food/coffee", 
			    "food/meal", 
			    "clothing", 
			    "electronics", 
			    "department", 
			    "misc"
		    ],  
			required: true  
		},  
		leaseEndDate: {  
		    type: "string",  
			required: true  
		},
		rent: {
			type: "string",
			required: true,
			validate: /^(\d+\.\d{2})$/
		},
		discount: {
			type: "string",
			required: false,
			default: "0.00",
			validate: /^(\d+\.\d{2})$/
		}  
	},  
	indexes: {  
	    stores: {  
			pk: {
				field: "pk",
				facets: ["storeId"]
			}, 
			sk: {
				field: "sk",
				facets: ["mallId", "buildingId", "unitId"]
			}  
		},  
		malls: {  
			index: "gsi1pk-gsi1sk-index",  
			pk: {
				field: "gsi1pk",
				facets: ["mallId"]
			},  
			sk: {
				field: "gsi1sk",
				facets: ["buildingId", "unitId", "storeId"]
			}  
		},
		leases: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["mallId"]
			},  
			sk: {
				field: "gsi3sk",
				facets: ["leaseEndDate", "rent", "storeId", "buildingId", "unitId"]
			}  
		}
	},
	filters: {
		byCategory: ({category}, name) => category.eq(name),
		rentDiscount: (attributes, discount, max, min) => {
			return `${attributes.discount.lte(discount)} AND ${attributes.rent.between(max, min)}`
		}
	}  
};



async function makeMallStores(MallStores, {mallId, buildingId, unitId, category, rent} = {}) {
    let stores = [];
    let storeEndDates = [];
    for (let i = 0; i < 10; i++) {
        let storeId = uuidV4();
        let leaseEndDate = moment("2020-02-29").add(i * 2, 'days').format("YYYY-MM-DD");
        storeEndDates.push({storeId, leaseEndDate});
        stores.push(MallStores.put({
            storeId,
            leaseEndDate,
            mallId,
            buildingId,
            unitId,
            category,
            rent,
        }).go());
    }
    await Promise.all(mallStores);
    return storeEndDates
}

async function testFilters() {
    let MallStores = new Entity(model);
    console.log("MALLSTORES", MallStores);
    let mallId = "EastPointe";
    let category = "food/coffee";
    let detail = {
        mallId,
        category,
        unitId: "B47",
        rent: "5000.00",
        buildingId: "BuildingA1",
    };
    let storeEndDates = await makeMallStores(detail);
    console.log(storeEndDates);
    let june = "2020-06";
    let july = "2020-07"; 
    let discount = "500.00";
    let maxRent = "2000.00";
    let minRent = "5000.00";
    // let one = MallStore.query.leases({mallId, leaseEndDate: june}).rentDiscount(discount, maxRent, minRent).params();
    let stores = await MallStores.query.leases({mallId}).between({leaseEndDate: june}, {leaseEndDate: july}).byCategory(category).go();
    console.log(stores);
}

testFilters().then(console.log).catch(console.log)
// let one = MallStore.query.leases({mallId, leaseEndDate: june}).rentDiscount(discount, maxRent, minRent).params();
// let two = MallStore.query.leases({mallId}).between({leaseEndDate: june}, {leaseEndDate: july}).byCategory("food/coffee").params();
// console.log("one", one);
// console.log("two", two);
