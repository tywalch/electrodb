import { assets } from "./entity";

// result is the actual DynamoDB response, despite the typing saying otherwise.
const result: any = await assets.query
  .locations({ state: "Georgia" })
  .go({ data: "raw" });
const { Items, LastEvaluatedKey } = result;
