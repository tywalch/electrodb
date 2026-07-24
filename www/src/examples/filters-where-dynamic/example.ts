import { animals } from "./entity";

type GetAnimalOptions = {
  habitat: string;
  keepers: string[];
};

function getAnimals(options: GetAnimalOptions) {
  const { habitat, keepers } = options;
  return animals.query.exhibit({ habitat })
  .where(({ keeper }, { eq }) => {
    return keepers.map((name) => eq(keeper, name)).join(' AND ');
  }).go()
}

const { data, cursor } = await getAnimals({
  habitat: "RainForest",
  keepers: ["Joe Exotic", "Carol Baskin"],
});
