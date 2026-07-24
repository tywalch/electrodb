import { member } from "./entities";

const { data, cursor } = await member.query
  .member({ memberId: "0000001" })
  .go();
