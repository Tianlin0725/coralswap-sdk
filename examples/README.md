# CoralSwap SDK Examples

This directory contains example scripts demonstrating how to use the CoralSwap SDK for various DeFi operations on Stellar/Soroban.

## Prerequisites

1. Copy `.env.example` to `.env` and configure your settings:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your `.env` file with:
   - Your Stellar secret key (for signing transactions)
   - Token contract addresses
   - Network settings (testnet/mainnet)

## Available Examples

### 1. Simple Swap (`simple-swap.ts`)

Demonstrates fetching swap quotes and executing token swaps.

```bash
npx ts-node simple-swap.ts
```

**Features:**
- Initialize CoralSwap client
- Fetch swap quotes with slippage protection
- Execute exact-in swaps
- Error handling with helpful hints

**Required env vars:**
- `SECRET_KEY` - Your Stellar secret key
- `TOKEN_IN` - Input token contract address
- `TOKEN_OUT` - Output token contract address

### 2. Provide Liquidity (`provide-liquidity.ts`)

Shows how to add and remove liquidity from pools.

```bash
npx ts-node provide-liquidity.ts
```

**Features:**
- Check existing pool status
- Get optimal liquidity quotes
- Add liquidity as first provider or join existing pool
- Query LP positions and pool share
- Remove liquidity demonstration

**Required env vars:**
- `SECRET_KEY` - Your Stellar secret key
- `TOKEN_A_ADDRESS` - First token address
- `TOKEN_B_ADDRESS` - Second token address

### 3. Read Reserves (`read-reserves.ts`)

Read-only operations for querying pool data without transactions.

```bash
npx ts-node read-reserves.ts
```

**Features:**
- List all pairs from factory
- Query pair reserves and token info
- Get dynamic fees and flash loan config
- Calculate spot prices and swap estimates
- TWAP oracle data
- Continuous polling simulation

**Note:** No secret key required for this example!

## Environment Variables

See `.env.example` for all available configuration options:

| Variable | Description | Required For |
|----------|-------------|--------------|
| `NETWORK` | testnet or mainnet | All |
| `SECRET_KEY` | Stellar secret key (S...) | Swaps, Liquidity |
| `RPC_URL` | Custom Soroban RPC URL | Optional |
| `TOKEN_IN/OUT` | Token addresses for swaps | simple-swap.ts |
| `TOKEN_A/B_ADDRESS` | Token addresses for liquidity | provide-liquidity.ts, read-reserves.ts |
| `DEFAULT_SLIPPAGE_BPS` | Default slippage tolerance | All |
| `DEADLINE_SECONDS` | Transaction deadline | All |

## Safety Notes

⚠️ **Important:**
- Never commit your `.env` file with real credentials
- Test on testnet before using mainnet
- The examples include a 5-second delay before executing transactions - press Ctrl+C to cancel
- Start with small amounts to verify everything works

## Troubleshooting

### "Pair not found" error
The token pair doesn't exist yet. You need to be the first liquidity provider by calling `addLiquidity()`.

### "Insufficient liquidity" error
The pool exists but has very low reserves. Try a smaller swap amount or find a more liquid pool.

### RPC errors
Check that your `NETWORK` setting matches the token addresses you're using (testnet vs mainnet).

## Learn More

- [CoralSwap SDK Documentation](https://github.com/CoralSwap-Finance/coralswap-sdk#readme)
- [Stellar Soroban Docs](https://soroban.stellar.org/)
- [Stellar Laboratory](https://laboratory.stellar.org/) - Test transactions manually
