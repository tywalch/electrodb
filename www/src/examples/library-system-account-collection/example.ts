import { library } from "./service";

const results = await library.collections
  .account({ memberId: "0000001" })
  .go()
  .then((result) => {
    const [member] = result.data.member;
    const books = result.data.book;
    return {
      member,
      books,
    };
  });
