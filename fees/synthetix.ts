import { Adapter } from "../adapters/types";
import { ARBITRUM, AVAX, ETHEREUM, OPTIMISM } from "../helpers/chains";
import { request, gql } from "graphql-request";
import type { ChainEndpoints } from "../adapters/types"
import { Chain } from '@defillama/sdk/build/general';
import { getTimestampAtStartOfDayUTC, getTimestampAtStartOfPreviousDayUTC } from "../utils/date";

const endpoints = {
  [ETHEREUM]: "https://api.thegraph.com/subgraphs/name/synthetixio-team/mainnet-main",
  [OPTIMISM]: "https://api.thegraph.com/subgraphs/name/synthetixio-team/optimism-main"
}

const graphs = (graphUrls: ChainEndpoints) => {
  return (chain: Chain) => {
    return async (timestamp: number) => {
      const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp)
      const yesterdaysTimestamp = getTimestampAtStartOfPreviousDayUTC(timestamp)

      const graphQuery = `query totals($todaysTimestamp: Int!, $yesterdaysTimestamp: Int!, $product: String!){
        totals(first: 1000, orderBy: timestamp, orderDirection: desc, where: { period: 86400, bucketMagnitude: 0, synth: null, timestamp_lte: $todaysTimestamp, timestamp_gte: $yesterdaysTimestamp, product: $product }) {
          totalFeesGeneratedInUSD
        }
      }`;

      const graphRes = await request(graphUrls[chain], graphQuery, { todaysTimestamp, yesterdaysTimestamp, product: "exchange" } );

      let dailyFee = graphRes.totals.reduce((accumulator: number, dailyTotal: any) => {
        return accumulator + Number(dailyTotal.totalFeesGeneratedInUSD)
      }, 0);
      
      if (chain == OPTIMISM) {
        const graphResOptimism = await request(graphUrls[chain], graphQuery, { todaysTimestamp, yesterdaysTimestamp, product: "futures" } );

        dailyFee += graphResOptimism.totals.reduce((accumulator: number, dailyTotal: any) => {
          return accumulator + Number(dailyTotal.totalFeesGeneratedInUSD)
        }, 0);
      }

      return {
        timestamp,
        totalFees: "0",
        dailyFees: dailyFee.toString(),
        totalRevenue: "0",
        dailyRevenue: dailyFee.toString(),
      };
    };
  };
};


const adapter: Adapter = {
  adapter: {
    [ETHEREUM]: {
        fetch: graphs(endpoints)(ETHEREUM),
        start: async ()  => 1528430400,
    },
    [OPTIMISM]: {
        fetch: graphs(endpoints)(OPTIMISM),
        start: async ()  => 1636606800,
    },
  }
}

export default adapter;
