import { library } from "./service";

await library.collections.detail({ isbn: "9783453435773" }).go();
await library.collections.titles({ bookTitle: "it" }).go();
