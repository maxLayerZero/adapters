import { DEFAULT_DAILY_VOLUME_FIELD, DEFAULT_TOTAL_VOLUME_FIELD, getChainVolume } from "../../helpers/getUniSubgraphVolume";
import { CHAIN } from "../../helpers/chains";
import request, { gql } from "graphql-request";
import { SimpleAdapter } from "../../adapters/types";

const blocksGraph = "https://www.okx.com/okc/subgraph/name/okcswap/okc-swap-subgraph-v3";

const blockQuery = gql`
  query blocks($timestampFrom: Int!, $timestampTo: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
    ) {
      id
      number
      timestamp
      __typename
    }
  }
`;


const endpoints = {
  [CHAIN.OKEXCHAIN]: "https://www.okx.com/okc/subgraph/name/okcswap/okc-swap-subgraph-v3"
}
const getCustomBlock = async (timestamp: number) => {
  const block = Number(
    (
      await request(blocksGraph, blockQuery, {
        timestampFrom: timestamp - 30,
        timestampTo: timestamp + 30,
      })
    ).blocks[0].number
  );

  return block;
};

const DAILY_VOLUME_FACTORY = "uniswapDayData";

const graphs = getChainVolume({
  graphUrls: endpoints,
  totalVolume: {
    factory: "uniswapFactories",
    field: DEFAULT_TOTAL_VOLUME_FIELD,
  },
  dailyVolume: {
    factory: DAILY_VOLUME_FACTORY,
    field: DEFAULT_DAILY_VOLUME_FIELD,
    dateField: 'date'
  },
  getCustomBlock,
});

const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.OKEXCHAIN]: {
      fetch: graphs(CHAIN.OKEXCHAIN),
      start: async () => 1661126400,
    },
  },
};

export default adapter;
