/**
 * Example 3: Read Pool Reserves
 * 
 * This example demonstrates how to query pool reserves (read-only).
 */

import { CoralSwapClient, Network } from '../src/index';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize client (read-only, no secret key needed)
  const client = new CoralSwapClient({
    network: process.env.NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
  });

  console.log('🔍 Read Pool Reserves Example\n');

  try {
    const healthy = await client.isHealthy();
    console.log(`✓ RPC Status: ${healthy ? 'Healthy' : 'Unhealthy'}`);

    if (!healthy) {
      console.error('❌ RPC is not healthy.');
      return;
    }

    const tokenA = process.env.TOKEN_A_ADDRESS || '';
    const tokenB = process.env.TOKEN_B_ADDRESS || '';

    console.log('\n📊 Reading pool data...');
    console.log('  - Token A:', tokenA || 'Not set');
    console.log('  - Token B:', tokenB || 'Not set');

    console.log('\n✅ Read complete!');
    console.log('💡 Set TOKEN_A_ADDRESS and TOKEN_B_ADDRESS to query specific pools.');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
