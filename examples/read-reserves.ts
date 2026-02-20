/**
 * Example: Read Reserves
 *
 * Demonstrates how to poll pair contracts for liquidity reserves,
 * token balances, and dynamic fee information without executing
 * any transactions.
 *
 * This is useful for:
 * - Building price oracles
 * - Monitoring pool health
 * - Calculating swap quotes off-chain
 * - Analyzing liquidity depth
 */

import { CoralSwapClient, Network } from '@coralswap/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration from environment
const RPC_URL = process.env.RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK = (process.env.NETWORK as Network) || Network.TESTNET;

// Token pair to query (example addresses)
const TOKEN_A = process.env.TOKEN_A_ADDRESS || '';
const TOKEN_B = process.env.TOKEN_B_ADDRESS || '';

/**
 * Main function demonstrating reserve reading operations
 */
async function main() {
  console.log('🔍 CoralSwap SDK - Read Reserves Example\n');

  // Initialize client (no secret key needed for read-only operations)
  const client = new CoralSwapClient({
    network: NETWORK,
    rpcUrl: RPC_URL,
  });

  // Check RPC health
  console.log('Checking RPC health...');
  const healthy = await client.isHealthy();
  console.log(`  RPC Status: ${healthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

  if (!healthy) {
    console.error('RPC is not healthy. Please check your configuration.');
    process.exit(1);
  }

  // Get current ledger
  const currentLedger = await client.getCurrentLedger();
  console.log(`Current Ledger: ${currentLedger}\n`);

  // Example 1: List all pairs from factory
  console.log('📋 Listing All Pairs from Factory');
  console.log('=====================================');
  try {
    const allPairs = await client.factory.getAllPairs();
    console.log(`Total pairs registered: ${allPairs.length}`);

    if (allPairs.length === 0) {
      console.log('No pairs found in the factory.');
    } else {
      for (let i = 0; i < Math.min(allPairs.length, 5); i++) {
        console.log(`  Pair ${i + 1}: ${allPairs[i]}`);
      }
      if (allPairs.length > 5) {
        console.log(`  ... and ${allPairs.length - 5} more`);
      }
    }
  } catch (error) {
    console.error('Error fetching pairs:', error);
  }
  console.log('');

  // Example 2: Query specific pair reserves
  console.log('💧 Querying Pair Reserves');
  console.log('==========================');

  if (!TOKEN_A || !TOKEN_B) {
    console.log('⚠️  TOKEN_A_ADDRESS and TOKEN_B_ADDRESS not set in .env');
    console.log('   Skipping pair-specific queries.\n');
  } else {
    try {
      // Get pair address
      const pairAddress = await client.getPairAddress(TOKEN_A, TOKEN_B);

      if (!pairAddress) {
        console.log(`❌ No pair exists for:`);
        console.log(`   Token A: ${TOKEN_A}`);
        console.log(`   Token B: ${TOKEN_B}`);
        console.log('\nYou may need to create this pair first using addLiquidity().\n');
      } else {
        console.log(`✅ Found pair at: ${pairAddress}\n`);

        // Create pair client
        const pair = client.pair(pairAddress);

        // Get token addresses
        console.log('Token Information:');
        const tokens = await pair.getTokens();
        console.log(`  Token 0: ${tokens.token0}`);
        console.log(`  Token 1: ${tokens.token1}`);
        console.log(`  Input Token A matches token${tokens.token0 === TOKEN_A ? '0' : '1'}`);
        console.log('');

        // Get reserves
        console.log('Reserves:');
        const reserves = await pair.getReserves();
        console.log(`  Reserve 0: ${formatReserve(reserves.reserve0)}`);
        console.log(`  Reserve 1: ${formatReserve(reserves.reserve1)}`);

        // Calculate total liquidity value (in terms of token0)
        const totalLiquidity = reserves.reserve0 + reserves.reserve1;
        console.log(`  Total Liquidity: ${formatReserve(totalLiquidity)}`);
        console.log('');

        // Get dynamic fee
        console.log('Fee Information:');
        const dynamicFee = await pair.getDynamicFee();
        console.log(`  Current Dynamic Fee: ${dynamicFee} bps (${(dynamicFee / 100).toFixed(2)}%)`);

        // Get detailed fee state
        try {
          const feeState = await pair.getFeeState();
          console.log(`  Fee Range: ${feeState.feeMin} - ${feeState.feeMax} bps`);
          console.log(`  Baseline Fee: ${feeState.baselineFee} bps`);
          console.log(`  EMA Alpha: ${feeState.emaAlpha}`);
        } catch (e) {
          console.log('  (Detailed fee state not available)');
        }
        console.log('');

        // Get flash loan config
        console.log('Flash Loan Configuration:');
        try {
          const flashConfig = await pair.getFlashLoanConfig();
          console.log(`  Flash Fee: ${flashConfig.flashFeeBps} bps`);
          console.log(`  Fee Floor: ${flashConfig.flashFeeFloor} bps`);
          console.log(`  Locked: ${flashConfig.locked ? 'Yes' : 'No'}`);
        } catch (e) {
          console.log('  (Flash loan config not available)');
        }
        console.log('');

        // Calculate spot price
        console.log('Spot Price Calculation:');
        if (reserves.reserve0 > 0n && reserves.reserve1 > 0n) {
          const price0Per1 = Number(reserves.reserve0) / Number(reserves.reserve1);
          const price1Per0 = Number(reserves.reserve1) / Number(reserves.reserve0);
          console.log(`  1 Token 1 = ${price0Per1.toFixed(8)} Token 0`);
          console.log(`  1 Token 0 = ${price1Per0.toFixed(8)} Token 1`);
        } else {
          console.log('  (Cannot calculate price - one reserve is zero)');
        }
        console.log('');

        // Estimate swap output (off-chain calculation)
        console.log('Swap Output Estimation:');
        const testAmount = 1000000n; // Example amount
        console.log(`  Input Amount: ${testAmount}`);

        if (reserves.reserve0 > 0n && reserves.reserve1 > 0n) {
          // Using constant product formula with fee
          const feeFactor = BigInt(10000 - dynamicFee);
          const amountInWithFee = testAmount * feeFactor;
          const numerator = amountInWithFee * reserves.reserve1;
          const denominator = reserves.reserve0 * 10000n + amountInWithFee;
          const estimatedOut = numerator / denominator;

          console.log(`  Estimated Output: ${estimatedOut}`);
          console.log(`  Effective Rate: 1 Token 0 = ${(Number(estimatedOut) / Number(testAmount)).toFixed(8)} Token 1`);
          console.log(`  Price Impact: ${calculatePriceImpact(testAmount, estimatedOut, reserves.reserve0, reserves.reserve1).toFixed(4)}%`);
        }
        console.log('');

        // TWAP Oracle data
        console.log('TWAP Oracle Data:');
        try {
          const cumulativePrices = await pair.getCumulativePrices();
          console.log(`  Price 0 Cumulative: ${cumulativePrices.price0CumulativeLast}`);
          console.log(`  Price 1 Cumulative: ${cumulativePrices.price1CumulativeLast}`);
          console.log(`  Last Updated: ${new Date(cumulativePrices.blockTimestampLast * 1000).toISOString()}`);
        } catch (e) {
          console.log('  (TWAP data not available)');
        }
        console.log('');
      }
    } catch (error) {
      console.error('Error querying pair:', error);
    }
  }

  // Example 3: Continuous polling simulation
  console.log('🔄 Simulating Continuous Polling (3 iterations)');
  console.log('================================================');

  if (!TOKEN_A || !TOKEN_B) {
    console.log('Skipping (no token addresses configured)\n');
  } else {
    for (let i = 0; i < 3; i++) {
      try {
        const pairAddress = await client.getPairAddress(TOKEN_A, TOKEN_B);
        if (pairAddress) {
          const pair = client.pair(pairAddress);
          const reserves = await pair.getReserves();
          const timestamp = new Date().toISOString();

          console.log(`[${timestamp}] Reserve0: ${reserves.reserve0}, Reserve1: ${reserves.reserve1}`);
        }
      } catch (error) {
        console.error(`Poll ${i + 1} failed:`, error);
      }

      if (i < 2) {
        console.log('Waiting 2 seconds before next poll...');
        await sleep(2000);
      }
    }
    console.log('');
  }

  console.log('✅ Read reserves example completed!');
}

/**
 * Format a reserve value for display
 */
function formatReserve(value: bigint): string {
  // Assuming 7 decimal places (standard for Stellar assets)
  const decimals = 7;
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  return `${integerPart}.${fractionalStr}`;
}

/**
 * Calculate price impact percentage
 */
function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n) return 0;
  const idealOut = (amountIn * reserveOut) / reserveIn;
  if (idealOut === 0n) return 0;
  const impact = ((idealOut - amountOut) * 10000n) / idealOut;
  return Number(impact) / 100;
}

/**
 * Sleep utility for polling delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
