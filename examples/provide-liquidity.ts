/**
 * Example: Provide Liquidity on CoralSwap
 *
 * This script demonstrates how to:
 * 1. Initialize the CoralSwap SDK client
 * 2. Get a quote for adding liquidity
 * 3. Add liquidity to a pool (first provider or joining existing)
 * 4. Query LP position and pool share
 * 5. Remove liquidity from a pool
 *
 * Usage:
 *   npx ts-node examples/provide-liquidity.ts
 *
 * Prerequisites:
 *   - Copy .env.example to .env and fill in your configuration
 *   - Ensure you have sufficient token balances and XLM for fees
 *   - For new pools, you'll be the first liquidity provider
 */

import { config } from 'dotenv';
config();

import {
  CoralSwapClient,
  Network,
  LiquidityModule,
  toSorobanAmount,
  fromSorobanAmount,
} from '../src';

// Validate environment variables
const SECRET_KEY = process.env.SECRET_KEY;
const NETWORK = (process.env.NETWORK as Network) || Network.TESTNET;
const RPC_URL = process.env.RPC_URL;
const TOKEN_A = process.env.TOKEN_A_ADDRESS;
const TOKEN_B = process.env.TOKEN_B_ADDRESS;

if (!SECRET_KEY) {
  console.error('Error: SECRET_KEY is required in .env file');
  process.exit(1);
}

if (!TOKEN_A || !TOKEN_B) {
  console.error('Error: TOKEN_A_ADDRESS and TOKEN_B_ADDRESS are required in .env file');
  process.exit(1);
}

async function main() {
  console.log('='.repeat(60));
  console.log('CoralSwap SDK - Provide Liquidity Example');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Initialize the CoralSwap client
  console.log('Step 1: Initializing CoralSwap client...');
  const clientConfig: any = {
    network: NETWORK,
    secretKey: SECRET_KEY,
  };

  if (RPC_URL) {
    clientConfig.rpcUrl = RPC_URL;
  }

  const client = new CoralSwapClient(clientConfig);
  console.log(`  ✓ Client initialized`);
  console.log(`  ✓ Public Key: ${client.publicKey}`);
  console.log(`  ✓ Network: ${NETWORK}`);
  console.log();

  // Step 2: Check RPC health
  console.log('Step 2: Checking RPC connection...');
  const healthy = await client.isHealthy();
  if (!healthy) {
    console.error('  ✗ RPC is not healthy. Please check your network settings.');
    process.exit(1);
  }
  console.log('  ✓ RPC connection is healthy');
  console.log();

  // Step 3: Initialize Liquidity module
  console.log('Step 3: Initializing Liquidity module...');
  const liquidity = new LiquidityModule(client);
  console.log('  ✓ Liquidity module ready');
  console.log();

  // Step 4: Check if pair exists
  console.log('Step 4: Checking liquidity pool status...');
  console.log(`  Token A: ${TOKEN_A}`);
  console.log(`  Token B: ${TOKEN_B}`);
  console.log();

  const pairAddress = await client.getPairAddress(TOKEN_A, TOKEN_B);

  if (!pairAddress) {
    console.log('  ℹ️  No existing pool found for this token pair.');
    console.log('     You will be the FIRST liquidity provider!');
    console.log();
  } else {
    console.log(`  ✓ Existing pool found at: ${pairAddress}`);

    // Get current reserves
    const pair = client.pair(pairAddress);
    const reserves = await pair.getReserves();
    console.log(`  Current Reserves:`);
    console.log(`    Reserve A: ${fromSorobanAmount(reserves.reserve0, 7)}`);
    console.log(`    Reserve B: ${fromSorobanAmount(reserves.reserve1, 7)}`);
    console.log();

    // Check existing LP position
    try {
      const position = await liquidity.getPosition(pairAddress, client.publicKey);
      if (position.balance > 0n) {
        console.log(`  Your LP Position:`);
        console.log(`    LP Balance: ${fromSorobanAmount(position.balance, 7)}`);
        console.log(`    Pool Share: ${(position.share * 100).toFixed(4)}%`);
        console.log(`    Token 0 Amount: ${fromSorobanAmount(position.token0Amount, 7)}`);
        console.log(`    Token 1 Amount: ${fromSorobanAmount(position.token1Amount, 7)}`);
      } else {
        console.log('  You do not have an LP position in this pool yet.');
      }
    } catch (e) {
      console.log('  Could not fetch LP position (may need to add liquidity first).');
    }
    console.log();
  }

  // Step 5: Get add liquidity quote
  console.log('Step 5: Getting add liquidity quote...');

  // Define amounts to add (in human-readable format)
  const amountA = toSorobanAmount('100', 7); // 100 tokens with 7 decimals

  console.log(`  Desired Amount A: ${fromSorobanAmount(amountA, 7)} tokens`);
  console.log('  Calculating optimal Amount B based on pool ratio...');
  console.log();

  try {
    const quote = await liquidity.getAddLiquidityQuote(TOKEN_A, TOKEN_B, amountA);

    console.log('  Quote received:');
    console.log(`    Amount A:          ${fromSorobanAmount(quote.amountA, 7)}`);
    console.log(`    Optimal Amount B:  ${fromSorobanAmount(quote.amountB, 7)}`);
    console.log(`    Estimated LP Tokens: ${fromSorobanAmount(quote.estimatedLPTokens, 7)}`);
    console.log(`    Pool Share:        ${(quote.shareOfPool * 100).toFixed(4)}%`);
    console.log(`    Price A/B:         ${Number(quote.priceAPerB) / 1e14}`);
    console.log(`    Price B/A:         ${Number(quote.priceBPerA) / 1e14}`);
    console.log();

    // Step 6: Execute add liquidity (optional - comment out if you just want to test quoting)
    console.log('Step 6: Adding liquidity...');
    console.log('  ⚠️  This will submit a real transaction to the blockchain!');
    console.log('  Press Ctrl+C within 5 seconds to cancel...');
    console.log();

    // Wait 5 seconds to allow cancellation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Calculate minimum amounts with 1% slippage tolerance
    const slippageBps = 100; // 1%
    const amountAMin = (quote.amountA * BigInt(10000 - slippageBps)) / 10000n;
    const amountBMin = (quote.amountB * BigInt(10000 - slippageBps)) / 10000n;

    const result = await liquidity.addLiquidity({
      tokenA: TOKEN_A,
      tokenB: TOKEN_B,
      amountADesired: quote.amountA,
      amountBDesired: quote.amountB,
      amountAMin,
      amountBMin,
      to: client.publicKey,
    });

    console.log('  ✓ Liquidity added successfully!');
    console.log(`    Transaction Hash: ${result.txHash}`);
    console.log(`    Ledger:           ${result.ledger}`);
    console.log(`    Amount A:         ${fromSorobanAmount(result.amountA, 7)}`);
    console.log(`    Amount B:         ${fromSorobanAmount(result.amountB, 7)}`);
    console.log();

    // Step 7: Query updated LP position
    console.log('Step 7: Verifying LP position...');
    const updatedPairAddress = await client.getPairAddress(TOKEN_A, TOKEN_B);
    if (updatedPairAddress) {
      const position = await liquidity.getPosition(updatedPairAddress, client.publicKey);
      console.log(`  Updated LP Position:`);
      console.log(`    LP Balance: ${fromSorobanAmount(position.balance, 7)}`);
      console.log(`    Pool Share: ${(position.share * 100).toFixed(4)}%`);
      console.log(`    Total Supply: ${fromSorobanAmount(position.totalSupply, 7)}`);
      console.log();

      // Step 8: Demonstrate remove liquidity (optional)
      console.log('Step 8: Remove liquidity demo (skipping execution)...');
      console.log('  To remove liquidity, you would call:');
      console.log();
      console.log('  await liquidity.removeLiquidity({');
      console.log('    tokenA: TOKEN_A,');
      console.log('    tokenB: TOKEN_B,');
      console.log(`    liquidity: ${fromSorobanAmount(position.balance, 7)}n,`);
      console.log('    amountAMin: calculatedMinimumA,');
      console.log('    amountBMin: calculatedMinimumB,');
      console.log(`    to: "${client.publicKey}",`);
      console.log('  });');
      console.log();
    }

    console.log('='.repeat(60));
    console.log('Liquidity provision completed successfully! 🎉');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('  ✗ Error:', error.message);

    // Provide helpful error messages for common issues
    if (error.message?.includes('insufficient balance')) {
      console.error('\n  Hint: You do not have enough token balance.');
      console.error('    1. Check your wallet balances');
      console.error('    2. Ensure you have both tokens A and B');
    } else if (error.message?.includes('deadline')) {
      console.error('\n  Hint: The transaction deadline was exceeded.');
      console.error('    Try again with a longer deadline.');
    }

    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
