import { Adapter } from "../adapters/types";
import { ARBITRUM, AVAX } from "../helpers/chains";
import { request, gql } from "graphql-request";
import type { ChainEndpoints } from "../adapters/types"
import { Chain } from '@defillama/sdk/build/general';
import { getTimestampAtStartOfDayUTC } from "../utils/date";

const endpoints = {
  [ARBITRUM]: "https://api.thegraph.com/subgraphs/name/gmx-io/gmx-stats",
  [AVAX]: "https://api.thegraph.com/subgraphs/name/gmx-io/gmx-avalanche-stats"
}

const graphs = (graphUrls: ChainEndpoints) => {
  return (chain: Chain) => {
    return async (timestamp: number) => {
      const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp)
      const searchTimestamp = chain == "arbitrum" ? todaysTimestamp : todaysTimestamp + ":daily"

      const graphQuery = gql
      `{
        feeStat(id: "${searchTimestamp}") {
          mint
          burn
          marginAndLiquidation
          swap
        }
      }`;

      const graphRes = await request(graphUrls[chain], graphQuery);

      const dailyFee = parseInt(graphRes.feeStat.mint) + parseInt(graphRes.feeStat.burn) + parseInt(graphRes.feeStat.marginAndLiquidation) + parseInt(graphRes.feeStat.swap)
      const finalDailyFee = (dailyFee / 1e30);

      return {
        timestamp,
        totalFees: "0",
        dailyFees: finalDailyFee.toString(),
        totalRevenue: "0",
        dailyRevenue: (finalDailyFee * 0.3).toString(),
      };
    };
  };
};


const adapter: Adapter = {
  adapter: {
    [ARBITRUM]: {
        fetch: graphs(endpoints)(ARBITRUM),
        start: async ()  => 1630468800,
    },
    [AVAX]: {
        fetch: graphs(endpoints)(AVAX),
        start: async ()  => 1641445200,
    },
  }
}

export default adapter;
