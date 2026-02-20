/**
 * Example: Simple Swap on CoralSwap
 *
 * This script demonstrates how to:
 * 1. Initialize the CoralSwap SDK client
 * 2. Fetch a swap quote for a token pair
 * 3. Execute the swap transaction
 *
 * Usage:
 *   npx ts-node examples/simple-swap.ts
 *
 * Prerequisites:
 *   - Copy .env.example to .env and fill in your configuration
 *   - Ensure you have sufficient token balance and XLM for fees
 */

import { config } from 'dotenv';
config();

import {
  CoralSwapClient,
  Network,
  TradeType,
  SwapModule,
  toSorobanAmount,
  fromSorobanAmount,
} from '../src';

// Validate environment variables
const SECRET_KEY = process.env.SECRET_KEY;
const NETWORK = (process.env.NETWORK as Network) || Network.TESTNET;
const RPC_URL = process.env.RPC_URL;
const TOKEN_IN = process.env.TOKEN_IN;
const TOKEN_OUT = process.env.TOKEN_OUT;

if (!SECRET_KEY) {
  console.error('Error: SECRET_KEY is required in .env file');
  process.exit(1);
}

if (!TOKEN_IN || !TOKEN_OUT) {
  console.error('Error: TOKEN_IN and TOKEN_OUT are required in .env file');
  process.exit(1);
}

async function main() {
  console.log('='.repeat(60));
  console.log('CoralSwap SDK - Simple Swap Example');
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

  // Step 3: Initialize Swap module
  console.log('Step 3: Initializing Swap module...');
  const swap = new SwapModule(client);
  console.log('  ✓ Swap module ready');
  console.log();

  // Step 4: Get swap quote
  console.log('Step 4: Fetching swap quote...');
  console.log(`  Token In:  ${TOKEN_IN}`);
  console.log(`  Token Out: ${TOKEN_OUT}`);

  // Define swap parameters
  const amountIn = toSorobanAmount('10', 7); // 10 tokens with 7 decimals
  const slippageBps = 50; // 0.5% slippage tolerance

  console.log(`  Amount In: ${fromSorobanAmount(amountIn, 7)} tokens`);
  console.log(`  Slippage:  ${slippageBps / 100}%`);
  console.log();

  try {
    const quote = await swap.getQuote({
      tokenIn: TOKEN_IN,
      tokenOut: TOKEN_OUT,
      amount: amountIn,
      tradeType: TradeType.EXACT_IN,
      slippageBps,
    });

    console.log('  Quote received:');
    console.log(`    Amount In:      ${fromSorobanAmount(quote.amountIn, 7)}`);
    console.log(`    Amount Out:     ${fromSorobanAmount(quote.amountOut, 7)}`);
    console.log(`    Min Amount Out: ${fromSorobanAmount(quote.amountOutMin, 7)}`);
    console.log(`    Fee:            ${quote.feeBps} bps (${quote.feeBps / 100}%)`);
    console.log(`    Price Impact:   ${quote.priceImpactBps / 100}%`);
    console.log(`    Deadline:       ${new Date(quote.deadline * 1000).toISOString()}`);
    console.log();

    // Step 5: Execute the swap (optional - comment out if you just want to test quoting)
    console.log('Step 5: Executing swap...');
    console.log('  ⚠️  This will submit a real transaction to the blockchain!');
    console.log('  Press Ctrl+C within 5 seconds to cancel...');
    console.log();

    // Wait 5 seconds to allow cancellation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const result = await swap.execute({
      tokenIn: TOKEN_IN,
      tokenOut: TOKEN_OUT,
      amount: amountIn,
      tradeType: TradeType.EXACT_IN,
      slippageBps,
    });

    console.log('  ✓ Swap executed successfully!');
    console.log(`    Transaction Hash: ${result.txHash}`);
    console.log(`    Ledger:           ${result.ledger}`);
    console.log(`    Timestamp:        ${new Date(result.timestamp * 1000).toISOString()}`);
    console.log(`    Amount In:        ${fromSorobanAmount(result.amountIn, 7)}`);
    console.log(`    Amount Out:       ${fromSorobanAmount(result.amountOut, 7)}`);
    console.log(`    Fee Paid:         ${fromSorobanAmount(result.feePaid, 7)}`);
    console.log();

    console.log('='.repeat(60));
    console.log('Swap completed successfully! 🎉');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('  ✗ Error during swap:', error.message);

    // Provide helpful error messages for common issues
    if (error.message?.includes('PairNotFound')) {
      console.error('\n  Hint: The token pair does not exist. You may need to:');
      console.error('    1. Create the liquidity pool first');
      console.error('    2. Check that the token addresses are correct');
    } else if (error.message?.includes('InsufficientLiquidity')) {
      console.error('\n  Hint: The liquidity pool has insufficient reserves.');
    } else if (error.message?.includes('Slippage')) {
      console.error('\n  Hint: Try increasing the slippage tolerance.');
    }

    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
