var helper = require('./utils');
var stakesCache = {
  vcp: new Map(),
  gcp: new Map(),
  eenp: new Map()
}
var stakeKeysCache = {
  vcp: new Set(),
  gcp: new Set(),
  eenp: new Set()
}

function shallowEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }
  return true;
}
async function updateStakeWithCache(candidateList, type, stakeDao) {
  let cacheKeyRef = stakeKeysCache[`${type}`];
  let cacheRef = stakesCache[`${type}`];
  if (cacheKeyRef.size === 0) {
    await stakeDao.removeRecordsAsync(type);
  }
  let updateStakeList = [];
  let existKeys = new Set(cacheKeyRef);
  for (let candidate of candidateList) {
    const holder = candidate.Holder;
    const stakes = candidate.Stakes;
    for (let stake of stakes) {
      const id = `${type}_${holder}_${stake.source}`;
      const stakeInfo = {
        '_id': id,
        'type': type,
        'holder': holder,
        'source': stake.source,
        'amount': stake.amount,
        'withdrawn': stake.withdrawn,
        'return_height': stake.return_height
      }
      if (existKeys.has(id)) {
        existKeys.delete(id);
        if (!shallowEqual(cacheRef.get(id), stakeInfo)) {
          updateStakeList.push(stakeInfo);
        }
      } else {
        updateStakeList.push(stakeInfo);
        cacheKeyRef.add(id);
        cacheRef.set(id, stakeInfo);
      }
    };
  }
  let deleteKeys = [...existKeys];
  for (let stake of updateStakeList) {
    await stakeDao.insertAsync(stake);
  }
  console.log('updateStakeList length:', updateStakeList.length, 'type:', type)
  console.log('delete keys length:', deleteKeys.length, 'type:', type);
  await stakeDao.removeRecordsByIdAsync(type, deleteKeys);
  for (let key of deleteKeys) {
    cacheRef.delete(key);
  }
}

exports.updateStake = async function (candidate, type, stakeDao) {
  const holder = candidate.Holder;
  const stakes = candidate.Stakes;
  let insertList = [];
  stakes.forEach(stake => {
    const stakeInfo = {
      '_id': `${type}_${holder}_${stake.source}`,
      'type': type,
      'holder': holder,
      'source': stake.source,
      'amount': stake.amount,
      'withdrawn': stake.withdrawn,
      'return_height': stake.return_height
    }
    insertList.push(stakeDao.insertAsync(stakeInfo));
  });
  await Promise.all(insertList);
}
exports.updateStakes = async function (candidateList, type, stakeDao, cacheEnabled) {
  // console.log('before update stakes:', type)
  // await stakeDao.updateStakesAsync(candidateList, type);
  // console.log('after update stakes:', type)
  if(cacheEnabled){
    await updateStakeWithCache(candidateList, type, stakeDao);
    return;
  }
  await stakeDao.updateStakesAsync(candidateList, type);
}
exports.updateTotalStake = function (totalStake, progressDao) {
  let totalTheta = 0, totalTfuel = 0;
  let thetaHolders = new Set(), tfuelHolders = new Set();
  totalStake.vcp.forEach(vcpPair => {
    vcpPair.Vcp.SortedCandidates.forEach(candidate => {
      thetaHolders.add(candidate.Holder)
      candidate.Stakes.forEach(stake => {
        totalTheta = helper.sumCoin(totalTheta, stake.withdrawn ? 0 : stake.amount)
      })
    })
  })
  totalStake.gcp.forEach(gcpPair => {
    gcpPair.Gcp.SortedGuardians.forEach(candidate => {
      thetaHolders.add(candidate.Holder)
      candidate.Stakes.forEach(stake => {
        totalTheta = helper.sumCoin(totalTheta, stake.withdrawn ? 0 : stake.amount)
      })
    })
  })
  totalStake.eenp.forEach(eenpPair => {
    eenpPair.Eenp.SortedEliteEdgeNodes.forEach(candidate => {
      tfuelHolders.add(candidate.Holder);
      candidate.Stakes.forEach(stake => {
        totalTfuel = helper.sumCoin(totalTfuel, stake.withdrawn ? 0 : stake.amount);
      })
    })
  })
  progressDao.upsertStakeProgressAsync('theta', totalTheta.toFixed(), thetaHolders.size);
  progressDao.upsertStakeProgressAsync('tfuel', totalTfuel.toFixed(), tfuelHolders.size);
}