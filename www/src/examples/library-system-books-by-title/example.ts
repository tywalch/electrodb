import { book } from "./entities";

const { data, cursor } = await book.query.releases({ bookTitle: "it" }).go();
