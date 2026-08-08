import { Organization } from "./entity";

const id = "00001";
const existing = await Organization.get({ id }).go();

if (existing.data?.deleted) {
  await Organization.update({ id: "00001" })
    .set({ deleted: false })
    .composite({ createdAt: existing.data.createdAt })
    .go();
}
