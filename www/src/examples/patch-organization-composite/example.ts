import { Organization } from "./entity";

const id = "00001";
const existing = await Organization.get({ id }).go();

await Organization.patch({ id: "00001" })
  .set({ deleted: false })
  .composite({ createdAt: existing.data?.createdAt ?? new Date().toISOString() })
  .go();
