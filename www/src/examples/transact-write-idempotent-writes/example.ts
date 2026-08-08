import { mi6 } from "./service";

type IncrementAgentKillsOptions = {
  id: string;
  kills: number;
  token: string;
  designation: string;
};

async function incrementAgentKills(options: IncrementAgentKillsOptions) {
  const { id, designation, kills, token } = options;

  return mi6.transaction
    .write(({ agent }) => [
      agent.patch({ id, designation }).add({ kills }).commit(),
    ])
    .go({ token });
}

const token = "daily-headcount-count-2022-03-16";

// kills `0` -> `2`
await incrementAgentKills({
  token,
  id: "7",
  kills: 2,
  designation: "00",
});

// still results in `2`
await incrementAgentKills({
  token,
  id: "7",
  kills: 2,
  designation: "00",
});
