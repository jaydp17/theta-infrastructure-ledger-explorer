export const WEI = 1000000000000000000;
export const GWEI = 1000000000;

export const ZeroAddress = '0x0000000000000000000000000000000000000000';

export const zeroTxAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const TxnTypes = {
  COINBASE: 0,
  SLASH: 1,
  TRANSFER: 2,
  RESERVE_FUND: 3,
  RELEASE_FUND: 4,
  SERVICE_PAYMENT: 5,
  SPLIT_CONTRACT: 6,
  SMART_CONTRACT: 7,
  DEPOSIT_STAKE: 8,
  WITHDRAW_STAKE: 9,
  DEPOSIT_STAKE_TX_V2: 10,
  STAKE_REWARD_DISTRIBUTION: 11,
  SUBCHAIN_VALIDATOR_SET_UPDATE: 201
}

export const TxnTypeText = {
  '0': 'Coinbase',
  '1': 'Slash',
  '2': 'Transfer',
  '3': 'Reserve fund',
  '4': 'Release fund',
  '5': 'Service Payment',
  '6': 'Split Contract',
  '7': 'Smart Contract',
  '8': 'Deposit Stake',
  '9': 'Withdraw Stake',
  '10': 'Deposit Stake',
  '11': 'Stake Reward Distribution',
  '201': 'Validator Set Update'
}

export const ChainType = {
  SUBCHAIN: 'SUBCHAIN',
  MAINCHAIN: 'MAINCHAIN',
  METACHAIN: 'METACHAIN'
}

export const TypeOptions = Object.keys(TxnTypeText)
  .map(key => ({ value: key, label: TxnTypeText[key] }))
  .filter(o => o.value !== '8')

export const TxnClasses = {
  '0': 'coinbase',
  '1': 'slash',
  '2': 'transfer',
  '3': 'reserve',
  '4': 'release',
  '5': 'service-payment',
  '6': 'split-contract',
  '7': 'smart-contract',
  '8': 'deposit-stake',
  '9': 'withdraw-stake',
  '10': 'deposit-stake',
  '11': 'stake-reward-distribution',
  '201': 'subchain-validator-set-update'
}

export const TxnStatus = {
  FINALIZED: 'finalized',
  PENDING: 'pending',
}

export const BlockStatus = {
  0: 'Pending',
  1: 'Valid',
  2: 'Invalid',
  3: 'Committed',
  4: 'Finalized',
  5: 'Finalized',
  6: 'Finalized'
}

export const CurrencyLabels = {
  thetawei: 'Theta',
  tfuelwei: 'TFuel',
}

export const TokenIcons = {
  'TDrop Token': 'tdrop',
  'AuraToken': 'aura'
}

export const TxnPurpose = {
  0: 'Validator Staking',
  1: 'Guardian Staking',
  2: 'Elite Edge Staking'
}
export const TxnSplitPurpose = {
  1: 'Guardian Stake Reward Split',
  2: 'Elite Edge Stake Reward Split'
}
export const TokenTypes = {
  THETA: 'theta',
  THETA_FUEL: 'tfuel',
};

export const nodeTypes = {
  vcp: 'Validator',
  gcp: 'Guardian',
  eenp: 'Elite Edge'
}

export const ChainList = {
  mainChain: [{
    name: "Theta Beta Main Chain",
    logoName: "theta",
    host: "https://beta-explorer.thetatoken.org",
    restApiPort: 8843,
    socketApiPort: 2096,
    description: "One sentence description of the Theta Main Chain"
  }],
  subChain: [{
    name: "Theta Smart Contract Test Chain",
    logoName: "replay",
    host: "https://smart-contracts-sandbox-explorer.thetatoken.org",
    restApiPort: 8843,
    socketApiPort: 2096,
    description: "One sentence description of subchain #1"
  }, {
    name: "Theta Smart Contract Test Chain 2",
    logoName: "replay",
    host: "https://smart-contracts-sandbox-explorer.thetatoken.org",
    restApiPort: 8843,
    socketApiPort: 2096,
    description: "One sentence description of subchain #2"
  }]
}

export const Networks = {
  __deprecated__ETHEREUM: 'ethereum',
  THETA_TESTNET: 'testnet',
  THETA_TESTNET_AMBER: 'testnet_amber',
  THETA_TESTNET_SAPPHIRE: 'testnet_sapphire',
  THETA_MAINNET: 'mainnet',
  THETA_PRIVATENET: 'privatenet',
};

export const NetworkUrlOfChainId = {
  'https://explorer.thetatoken.org': Networks.THETA_MAINNET,
  'https://stg-explorer.thetatoken.org': Networks.THETA_MAINNET,
  'https://beta-explorer.thetatoken.org': Networks.THETA_TESTNET,
  'https://testnet-explorer.thetatoken.org': Networks.THETA_TESTNET,
  'https://guardian-testnet-explorer-amber.thetatoken.org': Networks.THETA_TESTNET_AMBER,
  'https://guardian-testnet-explorer.thetatoken.org': Networks.THETA_TESTNET_SAPPHIRE,
  'https://smart-contracts-sandbox-explorer.thetatoken.org': Networks.THETA_PRIVATENET,
  'https://localhost': Networks.THETA_PRIVATENET,
};

export const EthRPCEndpoints = {
  'https://explorer.thetatoken.org': "https://eth-rpc-api.thetatoken.org/rpc",
  'https://stg-explorer.thetatoken.org': "https://eth-rpc-api.thetatoken.org/rpc",
  'https://beta-explorer.thetatoken.org': "https://eth-rpc-api-testnet.thetatoken.org/rpc",
  'https://testnet-explorer.thetatoken.org': "https://eth-rpc-api-testnet.thetatoken.org/rpc",
  'https://localhost': "http://localhost:18888/rpc",
}

export const TDropStakingAddress = {
  'testnet': '0xa8bfa60203e55f86dc7013cbf3d8ff85bb1d3cc7',
  'mainnet': '0xa89c744db76266eca60e2b0f62afcd1f8581b7ed'
};

export const CommonEventABIs = {
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": [{
    anonymous: false,
    inputs: [{ indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'value', type: 'uint256' }],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' }],
    name: 'Transfer',
    type: 'event'
  }],
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": [{
    anonymous: false,
    inputs: [{ indexed: true, name: 'owner', type: 'address' },
    { indexed: true, name: 'spender', type: 'address' },
    { indexed: false, name: 'value', type: 'uint256' }],
    name: "Approval",
    type: "event"
  }, {
    anonymous: false,
    inputs: [{ indexed: true, name: 'owner', type: 'address' },
    { indexed: true, name: 'approved', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' }],
    name: "Approval",
    type: "event"
  }],
  "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31": [{
    anonymous: false,
    inputs: [{ indexed: true, name: 'owner', type: 'address' },
    { indexed: true, name: 'operator', type: 'address' },
    { indexed: false, name: 'approved', type: 'bool' }],
    name: 'ApprovalForAll',
    type: 'event'
  }],
  "0x80742bd15a2c8c4ad5d395bcf577073110e52f0c73bf980dfa9453c1d8c354e5": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "targetChainVoucherReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "mintedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "sourceChainTokenLockNonce", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "voucherMintNonce", "type": "uint256" }],
    "name": "TFuelVoucherMinted",
    "type": "event"
  }],
  "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62": [{
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
    { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
    { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }],
    "name": "TransferSingle",
    "type": "event"
  }],
  "0x40f1d475c2aa44f5c23193fab26a64d6aa4e09ab51898b10a3036baf82398ea1": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "sourceChainVoucherOwner", "type": "address" },
    { "indexed": false, "internalType": "address", "name": "targetChainTokenReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "burnedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "voucherBurnNonce", "type": "uint256" }],
    "name": "TFuelVoucherBurned",
    "type": "event"
  }]
}

export const CommonFunctionABIs = {
  name: {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  symbol: {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  decimals: {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  tokenURI: {
    "constant": true,
    "inputs": [{ "name": "_tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  estimatedTDropOwnedBy: {
    "constant": true,
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "estimatedTDropOwnedBy",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  totalSupply: {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
}