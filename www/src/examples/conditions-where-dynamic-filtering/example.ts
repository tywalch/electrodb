import { animals } from "./entity";

type GetAnimalOptions = {
  habitat: string;
  keepers: string[];
};
function getAnimals(options: GetAnimalOptions) {
  const { habitat, keepers } = options;
  const query = animals.query.exhibit({ habitat });

  for (const name of keepers) {
    query.where(({ keeper }, { ne }) => ne(keeper, name));
  }

  return query.go();
}

const { data, cursor } = await getAnimals({
  habitat: "RainForest",
  keepers: ["Joe Exotic", "Carol Baskin"],
});
