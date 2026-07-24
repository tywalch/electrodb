import { book } from "./entities";

const { data, cursor } = await book.query.loans({ memberId: "0000001" }).go();
