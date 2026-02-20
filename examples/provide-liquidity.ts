/**
 * Example 2: Provide Liquidity
 * 
 * This example demonstrates how to add and remove liquidity from a pool.
 */

import { CoralSwapClient, Network } from '../src/index';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new CoralSwapClient({
    network: process.env.NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
    secretKey: process.env.SECRET_KEY || '',
  });

  console.log('💧 Provide Liquidity Example\n');

  try {
    const healthy = await client.isHealthy();
    console.log(`✓ RPC Status: ${healthy ? 'Healthy' : 'Unhealthy'}`);

    if (!healthy) {
      console.error('❌ RPC is not healthy.');
      return;
    }

    const tokenA = process.env.TOKEN_A_ADDRESS || '';
    const tokenB = process.env.TOKEN_B_ADDRESS || '';

    if (!tokenA || !tokenB) {
      console.error('❌ Please set TOKEN_A_ADDRESS and TOKEN_B_ADDRESS in .env file');
      return;
    }

    console.log('\n📊 Pool Information:');
    console.log('  - Token A:', tokenA);
    console.log('  - Token B:', tokenB);

    // Add liquidity (commented out for safety)
    // const result = await client.addLiquidity({
    //   tokenA,
    //   tokenB,
    //   amountA: '100',
    //   amountB: '100',
    // });

    console.log('\n✅ Liquidity provision ready!');
    console.log('💡 Uncomment the addLiquidity code to execute.');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
