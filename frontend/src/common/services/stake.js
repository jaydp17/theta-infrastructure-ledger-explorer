import { apiService } from './api';

export const stakeService = {
  getAllStake() {
    return apiService.get(`stake/all`, {});
  },
  getTotalStake() {
    return apiService.get(`stake/totalAmount`, {})
  },
  getStakeByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`stake/${address}`, {});
  },
  getStakeReturnTime(height) {
    return apiService.get(`stake/returnTime`, { params: { return_height: height } })
  }
};
