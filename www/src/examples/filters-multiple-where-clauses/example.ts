import { MallStores } from "./entity";

let stores = await MallStores.query
  .leases({ mallId: "EastPointe" })
  .between({ leaseEndDate: "2020-04-01" }, { leaseEndDate: "2020-07-01" })
  .where(
    ({ rent, discount }, { between, eq }) => `
		${between(rent, "2000.00", "5000.00")} AND ${eq(discount, "1000.00")}
	`,
  )
  .where(
    ({ category }, { eq }) => `
		${eq(category, "food/coffee")}
	`,
  )
  .go();
