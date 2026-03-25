export const DEFAULT_CRYPTO_DEPOSIT_OPTIONS = [
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    network: "Ethereum",
    minAmountUsd: 250,
    description: "ERC-20 USDC address for dollar-pegged settlements.",
    addresses: [
      {
        id: "usdc-primary",
        label: "XFA Platform USDC Treasury",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink:
          "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27&token_id=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
    ],
  },
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    minAmountUsd: 250,
    description: "SegWit-compatible treasury address for BTC settlements.",
    addresses: [
      {
        id: "btc-primary",
        label: "XFA Platform BTC Treasury",
        address: "bc1qm9pn705jdjxa6vmhp2csresuu92gp9wcy4r6el",
        deeplink:
          "https://link.trustwallet.com/send?coin=0&address=bc1qm9pn705jdjxa6vmhp2csresuu92gp9wcy4r6el",
      },
    ],
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    network: "Ethereum",
    minAmountUsd: 250,
    description: "Main XFA Platform hot wallet for ETH contributions.",
    addresses: [
      {
        id: "eth-primary",
        label: "XFA Platform ETH Treasury",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink:
          "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27",
      },
    ],
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    network: "Solana",
    minAmountUsd: 250,
    description: "Primary Solana program wallet for SOL payments.",
    addresses: [
      {
        id: "sol-primary",
        label: "XFA Platform SOL Treasury",
        address: "GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r",
        deeplink:
          "https://link.trustwallet.com/send?coin=501&address=GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r",
      },
    ],
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    network: "Ripple",
    minAmountUsd: 250,
    description: "Ripple network wallet for XRP settlements.",
    addresses: [
      {
        id: "xrp-primary",
        label: "XFA Platform XRP Treasury",
        address: "rfjJ8jW2nYdH6fjosNuMetRrqiPXP29xsQ",
        deeplink:
          "https://link.trustwallet.com/send?coin=144&address=rfjJ8jW2nYdH6fjosNuMetRrqiPXP29xsQ",
      },
    ],
  },
  {
    id: "xmr",
    symbol: "XMR",
    name: "Monero",
    network: "Solana (wrapped)",
    minAmountUsd: 500,
    description: "Privacy-preserving Monero wallet (Trust Wallet compatible).",
    addresses: [
      {
        id: "xmr-primary",
        label: "XFA Platform XMR Treasury",
        address: "GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r",
        deeplink:
          "https://link.trustwallet.com/send?coin=501&address=GrTwBor6VWsKbRgpfSfkLzb7T5Zn57jf4a3fENiobY5r&token_id=2JyjpmsaLLQpRVzHWgtobTF91Ao1PDK3rrgPZnjD6Wmg",
      },
    ],
  },
  {
    id: "monerochan",
    symbol: "MONEROCHAN",
    name: "Monerochan",
    network: "Ethereum",
    minAmountUsd: 100,
    description: "ERC-20 Monerochan token allocation address.",
    addresses: [
      {
        id: "monerochan-primary",
        label: "XFA Platform MONEROCHAN Treasury",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink:
          "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27&token_id=0x3f7dB133aFf2F012C8534b36aB9731fe9Ee7bd43",
      },
    ],
  },
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether USD",
    network: "Ethereum",
    minAmountUsd: 250,
    description: "USDT (ERC-20) address for stablecoin deposits.",
    addresses: [
      {
        id: "usdt-primary",
        label: "XFA Platform USDT Treasury",
        address: "0x2A83B6316254e07876d42D434fBF365854a4Fd27",
        deeplink:
          "https://link.trustwallet.com/send?coin=60&address=0x2A83B6316254e07876d42D434fBF365854a4Fd27&token_id=0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
    ],
  },
];
