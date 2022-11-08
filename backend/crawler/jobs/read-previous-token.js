const { get } = require('lodash');
const { EventHashMap, ZeroAddress, CommonEventABIs } = require('../helper/constants');
var Logger = require('../helper/logger');
var { decodeLogs, checkTnt721, checkTnt20, checkAndInsertToken } = require('../helper/smart-contract');
var { getHex } = require('../helper/utils');
var { ethers } = require("ethers");

var progressDao = null;
var blockDao = null;
var transactionDao = null;
var accountDao = null;
var accountTxDao = null;
var smartContractDao = null;
var tokenDao = null;
var tokenHolderDao = null;
var tokenSummaryDao = null;
var contractList = [];
var contractMap = null;

exports.Initialize = function (progressDaoInstance, blockDaoInstance, transactionDaoInstance, accountDaoInstance,
  accountTxDaoInstance, smartContractDaoInstance, tokenDaoInstance, tokenHolderDaoInstance, tokenSummaryDaoInstance,
  dailyAccountDaoInstance, contractAddressMap) {
  progressDao = progressDaoInstance;
  blockDao = blockDaoInstance;
  transactionDao = transactionDaoInstance;
  accountDao = accountDaoInstance;
  accountTxDao = accountTxDaoInstance;
  smartContractDao = smartContractDaoInstance;
  tokenDao = tokenDaoInstance;
  tokenHolderDao = tokenHolderDaoInstance;
  tokenSummaryDao = tokenSummaryDaoInstance;
  dailyAccountDao = dailyAccountDaoInstance;
  contractMap = contractAddressMap;
  contractList = Object.keys(contractAddressMap).map(name => contractAddressMap[name]);
}

exports.Execute = async function (networkId, retrieveStartHeight, flag) {
  if (!retrieveStartHeight) {
    flag.result = false;
    return;
  }
  let height = retrieveStartHeight;
  const blockNum = 200;
  try {
    let tokenProgressInfo = await progressDao.getTokenProgressAsync();
    height = tokenProgressInfo.block_height;
  } catch (e) {
    Logger.log('Error occurs in get token progress:', e.message);
  }
  Logger.log('Read previous token height:', height);
  // if (height < 13123789) { // for mainnet
  if (height < 1) {
    flag.result = false;
    return;
  }
  try {
    const startHeight = height - blockNum > 0 ? height - blockNum : 1;
    Logger.log(`startHeight: ${startHeight}, height: ${height}`)
    const blockListInfo = await blockDao.getBlocksByRangeAsync(startHeight, height);
    let txHashList = [];
    blockListInfo.forEach(block => {
      txHashList = txHashList.concat(block.txs.filter(tx => tx.type === 7).map(tx => tx.hash))
    })
    Logger.log('txHashList length:', txHashList.length);
    const txsInfoList = await transactionDao.getTransactionsByPkAsync(txHashList);
    //TODO: update token info
    await updateTokens(txsInfoList, smartContractDao, tokenDao, tokenSummaryDao)
    await progressDao.upsertTokenProgressAsync(startHeight - 1);
  } catch (e) {
    Logger.log('Error occurs while updating token and token progress:', e.message);
  }
}


async function updateTokens(txs, smartContractDao, tokenDao, tokenSummaryDao) {
  let infoMap = {};
  const tokenArr = [];
  const insertList = [];
  for (let tx of txs) {
    let addressList = _getOtherContractAddressSet(tx);
    console.log('address list length: ', addressList.length);
    if (addressList.length === 0) {
      continue;
    }
    // Generate info map
    for (let address of addressList) {
      if (infoMap[address] !== undefined) continue;
      infoMap[address] = {};
      const abiRes = await smartContractDao.getAbiAsync(address);
      const abi = get(abiRes[0], 'abi');
      if (!abi) {
        infoMap[address].abi = [];
        infoMap[address].type = 'unknown';
      } else {
        infoMap[address].abi = abi;
        infoMap[address].type = checkTnt721(abi) ? 'TNT-721' : checkTnt20(abi) ? 'TNT-20' : 'unknown';
        const tokenInfo = await tokenSummaryDao.getInfoByAddressAsync(address);
        infoMap[address].tokenName = get(tokenInfo, 'tokenName');
      }
    }
    // Logger.log('Info map:', infoMap);
    let logs = get(tx, 'receipt.Logs');
    logs = JSON.parse(JSON.stringify(logs));
    // // Only log of transfer event remains
    // Only log of TFuelVoucherMinted event remains
    logs = logs.map(obj => {
      obj.data = getHex(obj.data);
      return obj;
    })
    logs = decodeLogs(logs, infoMap);
    for (let [i, log] of logs.entries()) {
      // Check for TRANSFER event
      // if (get(log, 'address') === get(tx, 'receipt.ContractAddress')) {
      //   continue;
      // }
      switch (get(log, 'topics[0]')) {
        case EventHashMap.TFUEL_SPLIT:
          if (typeof get(log, 'decode') !== "object") {
            log = decodeLogByAbiHash(log, EventHashMap.TFUEL_SPLIT);
            let sellerInfo = {
              _id: tx.hash.toLowerCase() + i + '_0',
              hash: tx.hash.toLowerCase(),
              from: get(tx, 'data.from.address').toLowerCase(),
              to: get(log, 'decode.result[0]').toLowerCase(),
              value: get(log, 'decode.result[1]'),
              type: 'TFUEL',
              timestamp: tx.timestamp,
            }
            let platformInfo = {
              _id: tx.hash.toLowerCase() + i + '_1',
              hash: tx.hash.toLowerCase(),
              from: get(tx, 'data.from.address').toLowerCase(),
              to: get(log, 'decode.result[2]').toLowerCase(),
              value: get(log, 'decode.result[3]'),
              type: 'TFUEL',
              timestamp: tx.timestamp,
            }
            tokenArr.push(sellerInfo, platformInfo);
            insertList.push(checkAndInsertToken(sellerInfo, tokenDao), checkAndInsertToken(platformInfo, tokenDao))
          }
          break;
        case EventHashMap.TRANSFER:
          const contractAddress = get(log, 'address').toLowerCase();
          console.log('contractList:', JSON.stringify(contractList), '. contractAddress:', contractAddress);
          console.log(contractList.indexOf(contractAddress) > -1);
          if (contractList.indexOf(contractAddress) > -1) {
            let type = '';
            switch (contractAddress) {
              case contractMap.TNT20TokenBank:
                type = 'XCHAIN_TNT20'
                break;
              case contractMap.TNT721TokenBank:
                type = 'XCHAIN_TNT721'
                break;
              case contractMap.TNT1155TokenBank:
                type = 'XCHAIN_TNT1155'
                break;
              default:
                break;
            }
            log = decodeLogByAbiHash(log, EventHashMap.TRANSFER);
            const tokenId = get(log, 'decode.result.tokenId');
            const value = tokenId !== undefined ? 1 : get(log, 'decode.result[2]');
            const newToken = {
              _id: tx.hash.toLowerCase() + i,
              hash: tx.hash.toLowerCase(),
              from: (get(log, 'decode.result[0]') || '').toLowerCase(),
              to: (get(log, 'decode.result[1]') || '').toLowerCase(),
              token_id: tokenId,
              value,
              name: get(infoMap, `${contractAddress}.name`),
              type: type,
              timestamp: tx.timestamp,
              contract_address: contractAddress
            }
            tokenArr.push(newToken);
            insertList.push(checkAndInsertToken(newToken, tokenDao))
            continue;
          }
          // If log.address === tx.receipt.ContractAddress, and the contract has not been verified
          // this record will be hanlded in the contract verification
          if (get(infoMap, `${contractAddress}.type`) === 'unknow' && contractAddress === get(tx, 'receipt.ContractAddress')) {
            continue;
          }
          const tokenId = get(log, 'decode.result.tokenId');
          const value = tokenId !== undefined ? 1 : get(log, 'decode.result[2]');
          const newToken = {
            _id: tx.hash.toLowerCase() + i,
            hash: tx.hash.toLowerCase(),
            from: (get(log, 'decode.result[0]') || '').toLowerCase(),
            to: (get(log, 'decode.result[1]') || '').toLowerCase(),
            token_id: tokenId,
            value,
            name: get(infoMap, `${contractAddress}.name`),
            type: get(infoMap, `${contractAddress}.type`),
            timestamp: tx.timestamp,
            contract_address: contractAddress
          }
          tokenArr.push(newToken);
          insertList.push(checkAndInsertToken(newToken, tokenDao))
          break;
        case EventHashMap.TFUEL_VOUCHER_MINTED:
          if (typeof get(log, 'decode') !== "object") {
            log = decodeLogByAbiHash(log, EventHashMap.TFUEL_VOUCHER_MINTED);
            let xTfuelInfo = {
              _id: tx.hash.toLowerCase() + i + '_0',
              hash: tx.hash.toLowerCase(),
              from: get(log, 'decode.result[1]').toLowerCase(),
              to: get(log, 'decode.result[1]').toLowerCase(),
              value: get(log, 'decode.result[2]'),
              type: 'XCHAIN_TFUEL',
              timestamp: tx.timestamp,
            }
            tokenArr.push(xTfuelInfo);
            insertList.push(checkAndInsertToken(xTfuelInfo, tokenDao))
          }
          break;
        case EventHashMap.TRANSFER_SINGLE:
          if (typeof get(log, 'decode') !== "object") {
            log = decodeLogByAbiHash(log, EventHashMap.TRANSFER_SINGLE);
            Logger.log('Decoded TRANSFER_SINGLE Log:', JSON.stringify(log));
            let tokenInfo = {
              _id: tx.hash.toLowerCase() + i,
              hash: tx.hash.toLowerCase(),
              from: get(log, 'decode.result[1]').toLowerCase(),
              to: get(log, 'decode.result[2]').toLowerCase(),
              token_id: get(log, 'decode.result[3]'),
              value: get(log, 'decode.result[4]'),
              type: 'XCHAIN_TNT1155',
              timestamp: tx.timestamp,
            }
            tokenArr.push(tokenInfo);
            insertList.push(_checkAndInsertToken(tokenInfo, tokenDao))
          }
          break;
        default:
          break;
      }
    }
  }
  Logger.log('tokenArr:', JSON.stringify(tokenArr));
  return Promise.all(insertList);
}

function _getOtherContractAddressSet(tx) {
  let logs = get(tx, 'receipt.Logs');
  if (!logs) return [];
  let set = new Set();
  logs.forEach(log => {
    if (get(log, 'topics[0]') === EventHashMap.TRANSFER || get(log, 'topics[0]') === EventHashMap.TRANSFER_SINGLE) {
      // const address = get(log, 'address');
      // if (address !== undefined && address !== ZeroAddress && address !== get(tx, 'receipt.contractAddress')) {
      set.add(get(log, 'address'))
      // }
    }
    // if (get(log, 'topics[0]') === EventHashMap.TFUEL_VOUCHER_MINTED) {
    //   const address = get(log, 'address');
    //   if (address !== undefined && address !== ZeroAddress) {
    //     set.add(get(log, 'address'))
    //   }
    // }
  })
  return [...set];
}

function decodeLogByAbiHash(log, abiHash) {
  const events = CommonEventABIs[abiHash];
  for (let event of events) {
    try {
      const ifaceTmp = new ethers.utils.Interface([event] || []);
      let bigNumberData = ifaceTmp.decodeEventLog(event.name, log.data, log.topics);
      let data = {};
      Object.keys(bigNumberData).forEach(k => {
        data[k] = bigNumberData[k].toString();
      })
      log.decode = {
        result: data,
        eventName: event.name,
        event: event
      }
      break;
    } catch (e) {
      continue;
    }
  }
  return log;
}