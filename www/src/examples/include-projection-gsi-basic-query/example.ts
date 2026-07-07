import { tasks } from "./entity";

// Only returns the projected attributes: name, status, createdAt
const { data, cursor } = await tasks.query.statusIndex({ status: "open" }).go();

// data will only contain: { name: string, status: string, createdAt: number }[]
