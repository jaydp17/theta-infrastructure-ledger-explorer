import React from "react";
import Popup from "reactjs-popup";
import { Link } from 'react-router-dom';
import get from 'lodash/get';
import map from 'lodash/map';
import compact from 'lodash/compact';
// import 
import cx from 'classnames';

import { formatCoin, priceCoin, validateHex } from 'common/helpers/utils';
import { CurrencyLabels, TypeOptions, TxnTypeText } from 'common/constants';
import { accountService } from 'common/services/account';
import { transactionsService } from 'common/services/transaction';
import { stakeService } from 'common/services/stake';
import { priceService } from 'common/services/price';
import TransactionTable from "common/components/transactions-table";
import Pagination from "common/components/pagination";
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import LoadingPanel from 'common/components/loading-panel';
import StakeTxsTable from "../common/components/stake-txs";
import SmartContract from 'common/components/smart-contract';

import { Multiselect } from 'multiselect-react-dropdown';

const NUM_TRANSACTIONS = 20;
const today = new Date().toISOString().split("T")[0];
export default class AccountDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: this.getEmptyAccount(this.props.match.params.accountAddress),
      transactions: null,
      currentPage: 1,
      totalPages: null,
      errorType: null,
      loading_acct: false,
      loading_txns: false,
      includeService: false,
      hasOtherTxs: true,
      hasThetaStakes: false,
      hasTfuelStakes: false,
      hasDownloadTx: false,
      hasStartDateErr: false,
      hasEndDateErr: false,
      price: { 'Theta': 0, 'TFuel': 0 },
      isDownloading: false,
      hasRefreshBtn: false,
      selectedTypes: TypeOptions.filter(obj => obj.value !== '5'),
      typeOptions: null
    };
    this.downloadTrasanctionHistory = this.downloadTrasanctionHistory.bind(this);
    this.download = React.createRef();
    this.startDate = React.createRef();
    this.endDate = React.createRef();
    this.select = React.createRef();
    this.handleInput = this.handleInput.bind(this);
    this.resetInput = this.resetInput.bind(this);
  }
  getEmptyAccount(address) {
    return {
      address: address.toLowerCase(),
      balance: { thetawei: 0, tfuelwei: 0 },
      sequence: 0,
      reserved_funds: [],
      txs_counter: {}
    }
  }
  componentDidUpdate(preProps) {
    if (preProps.match.params.accountAddress !== this.props.match.params.accountAddress) {
      this.setState({ hasOtherTxs: true, includeService: false })
      this.fetchData(this.props.match.params.accountAddress);
    }
  }
  componentDidMount() {
    const { accountAddress } = this.props.match.params;
    this.fetchData(accountAddress, false);
  }
  fetchData(address, hasPrice = true) {
    if (validateHex(address, 40)) {
      this.getOneAccountByAddress(address);
      this.getStakeTransactions(address);
      if (!hasPrice) this.getPrices();
    } else {
      this.setState({ errorType: 'invalid_address' })
    }
  }
  getPrices(counter = 0) {
    priceService.getAllprices()
      .then(res => {
        const prices = get(res, 'data.body');
        let price = {};
        prices.forEach(info => {
          if (info._id === 'THETA') price.Theta = info.price;
          else if (info._id === 'TFUEL') price.TFuel = info.price;
        })
        this.setState({ price })
      })
      .catch(err => {
        console.log(err);
      });
    setTimeout(() => {
      let { price } = this.state;
      if ((!price.Theta || !price.TFuel) && counter++ < 4) {
        this.getPrices(counter);
      }
    }, 1000);
  }

  getStakeTransactions(address) {
    if (!address) {
      return;
    }
    stakeService.getStakeByAddress(address)
      .then(res => {
        const stakes = get(res, 'data.body');
        let thetaHolderTxs = [], tfuelHolderTxs = [];
        let thetaSourceTxs = [], tfuelSourceTxs = [];
        stakes.holderRecords.forEach(tx => {
          if (tx.type === 'eenp') tfuelHolderTxs.push(tx)
          else thetaHolderTxs.push(tx);
        })
        stakes.sourceRecords.forEach(tx => {
          if (tx.type === 'eenp') tfuelSourceTxs.push(tx)
          else thetaSourceTxs.push(tx);
        })
        this.setState({
          thetaHolderTxs,
          thetaSourceTxs,
          tfuelHolderTxs,
          tfuelSourceTxs,
          hasThetaStakes: thetaHolderTxs.length + thetaSourceTxs.length > 0,
          hasTfuelStakes: tfuelHolderTxs.length + tfuelSourceTxs.length > 0
        })
      })
      .catch(err => {
        console.log(err);
      });
  }
  getTransactionsByAddress(address, types, page = 1) {
    if (!address) {
      return;
    }
    this.setState({ loading_txns: true });
    transactionsService.getTransactionsByAddress(address, page, NUM_TRANSACTIONS, types)
      .then(res => {
        const txs = get(res, 'data.body');
        if (!txs) {
          this.setState({ hasOtherTxs: false, currentPage: 1, totalPages: null, transactions: [] })
          return
        }
        if (txs.length !== 0) {
          this.setState({
            transactions: get(res, 'data.body'),
            currentPage: get(res, 'data.currentPageNumber'),
            totalPages: get(res, 'data.totalPageNumber'),
            loading_txns: false,
          })
        } else {
          this.setState({ hasOtherTxs: false, loading_txns: false })
        }

      })
      .catch(err => {
        this.setState({ loading_txns: false });
        console.log(err);
      });
  }

  getOneAccountByAddress(address) {
    if (!address) {
      return;
    }

    this.setState({ loading_acct: true });
    accountService.getOneAccountByAddress(address)
      .then(res => {
        switch (res.data.type) {
          case 'account':
            const txs_counter = get(res, 'data.body.txs_counter');
            let typeOptions = Object.keys(txs_counter).map(k => ({ value: k, label: TxnTypeText[k] }))
            let restOptions = typeOptions.filter(o => o.value !== '5');
            let selectedTypes = restOptions.length > 0 ? restOptions : typeOptions;
            this.setState({
              account: res.data.body,
              errorType: null,
              selectedTypes: selectedTypes,
              typeOptions: typeOptions
            })
            break;
          case 'error_not_found':
            break;
          default:
            break;
        }
        this.setState({
          loading_acct: false, hasDownloadTx: (res.data.body.txs_counter[0]
            || res.data.body.txs_counter[2] || res.data.body.txs_counter[5]) !== undefined
        });
        let types = this.state.selectedTypes.map(o => o.value);
        this.getTransactionsByAddress(address, types, 1);
      }).catch(err => {
        this.setState({ loading_acct: false });
        console.log(err);
      })
  }

  handlePageChange = pageNumber => {
    let { accountAddress } = this.props.match.params;
    let { selectedTypes } = this.state;
    let types = selectedTypes.map(o => o.value);
    this.getTransactionsByAddress(accountAddress, types, pageNumber);
  }

  downloadTrasanctionHistory() {
    const { accountAddress } = this.props.match.params;
    const startDate = (new Date(this.startDate.value).getTime() / 1000).toString();
    const endDate = (new Date(this.endDate.value).getTime() / 1000).toString();
    let hasStartDateErr = false, hasEndDateErr = false;
    if (this.startDate.value === '' || this.endDate.value === '') {
      if (this.startDate.value === '') hasStartDateErr = true;
      if (this.endDate.value === '') hasEndDateErr = true;
      this.setState({ hasStartDateErr, hasEndDateErr })
      return
    }
    this.setState({ isDownloading: true })
    accountService.getTransactionHistory(accountAddress, startDate, endDate)
      .then(res => {
        if (res.status === 200) {
          function convertToCSV(objArray) {
            var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
            var str = '';
            var line = '';
            for (var index in array[0]) {
              if (line != '') line += ','
              line += index;
            }
            str += line + '\r\n';
            for (var i = 0; i < array.length; i++) {
              var line = '';
              for (var index in array[i]) {
                if (line != '') line += ','

                line += array[i][index];
              }

              str += line + '\r\n';
            }
            return str;
          }
          var json = JSON.stringify(res.data.body);
          var csv = convertToCSV(json);
          var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          // var blob = new Blob([json], { type: "application/json" });
          var url = URL.createObjectURL(blob);
          this.download.current.download = 'transactions.csv';
          this.download.current.href = url;
          this.download.current.click();
          this.setState({ isDownloading: false })
        }
      });
  }
  handleInput(type) {
    if (type === 'start') {
      let date = new Date(this.startDate.value)
      date.setDate(date.getDate() + 7);
      this.endDate.min = this.startDate.value;
      let newDate = this.getDate(date);
      this.endDate.max = newDate < today ? newDate : today;
    } else if (type === 'end') {
      let date = new Date(this.endDate.value)
      date.setDate(date.getDate() - 7);
      this.startDate.max = this.endDate.value;
      this.startDate.min = this.getDate(date);
    }
    if (type === 'start' && !this.hasStartDateErr) this.setState({ hasStartDateErr: false })
    if (type === 'end' && !this.hasEndDateErr) this.setState({ hasEndDateErr: false })
  }
  getDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    return year + '-' + month + '-' + day;
  }
  resetInput() {
    this.startDate.value = '';
    this.startDate.max = today;
    this.startDate.min = '';
    this.endDate.value = '';
    this.endDate.max = today;
    this.endDate.min = '';
  }
  handleSelect = (selectedList, selectedItem) => {
    this.setState({
      selectedTypes: selectedList,
      hasRefreshBtn: selectedList.length > 0 ? true : false
    })
  }
  handleTxsRefresh = () => {
    const { accountAddress } = this.props.match.params;
    const { selectedTypes } = this.state;
    const types = selectedTypes.map(o => o.value);
    this.getTransactionsByAddress(accountAddress, types, 1);
    this.setState({ hasRefreshBtn: false });
  }
  render() {
    const { account, transactions, currentPage, totalPages, errorType, loading_txns,
      includeService, hasOtherTxs, hasThetaStakes, hasTfuelStakes, thetaHolderTxs, hasDownloadTx, thetaSourceTxs,
      tfuelHolderTxs, tfuelSourceTxs, price, hasStartDateErr, hasEndDateErr, isDownloading,
      hasRefreshBtn, typeOptions } = this.state;
    return (
      <div className="content account">
        <div className="page-title account">Account Detail</div>
        {errorType === 'invalid_address' &&
          // <NotExist msg="Note: An account will not be created until the first time it receives some tokens." />
          <NotExist msg="Note: Invalid address." />}
        {account && !errorType &&
          <React.Fragment>
            <table className="details account-info">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>{account.address}</th>
                </tr>
              </thead>
              <tbody>
                <DetailsRow label="Balance" data={<Balance balance={account.balance} price={price} />} />
                <DetailsRow label="Sequence" data={account.sequence} />
              </tbody>
            </table>
          </React.Fragment>}
        {hasThetaStakes &&
          <div className="stake-container">
            {thetaSourceTxs.length > 0 && <StakeTxsTable type='source' stakeCoinType='theta' txs={thetaSourceTxs} price={price} />}
            {thetaHolderTxs.length > 0 && <StakeTxsTable type='holder' stakeCoinType='theta' txs={thetaHolderTxs} price={price} />}
          </div>
        }
        {hasTfuelStakes &&
          <div className="stake-container">
            {tfuelSourceTxs.length > 0 && <StakeTxsTable type='source' stakeCoinType='tfuel' txs={tfuelSourceTxs} price={price} />}
            {tfuelHolderTxs.length > 0 && <StakeTxsTable type='holder' stakeCoinType='tfuel' txs={tfuelHolderTxs} price={price} />}
          </div>
        }
        {!transactions && loading_txns &&
          <LoadingPanel />}
        {transactions && transactions.length > 0 &&
          <React.Fragment>
            <div className="actions">
              {hasDownloadTx && <Popup trigger={<div className="download btn tx export">Export Transaction History (CSV)</div>} position="right center">
                <React.Fragment>
                  <div className="popup-row header">Choose the time period. Must within 7 days.</div>
                  <div className="popup-row">
                    <div className="popup-label">Start Date:</div>
                    <input className="popup-input" type="date" ref={input => this.startDate = input} onChange={() => this.handleInput('start')} max={today}></input>
                  </div>
                  <div className={cx("popup-row err-msg", { 'disable': !hasStartDateErr })}>Input Valid Start Date</div>
                  <div className="popup-row">
                    <div className="popup-label">End Date: </div>
                    <input className="popup-input" type="date" ref={input => this.endDate = input} onChange={() => this.handleInput('end')} max={today}></input>
                  </div>
                  <div className={cx("popup-row err-msg", { 'disable': !hasEndDateErr })}>Input Valid End Date</div>
                  <div className="popup-row buttons">
                    <div className={cx("popup-reset", { disable: isDownloading })} onClick={this.resetInput}>Reset</div>
                    <div className={cx("popup-download export", { disable: isDownloading })} onClick={this.downloadTrasanctionHistory}>Download</div>
                    <div className={cx("popup-downloading", { disable: !isDownloading })}>Downloading......</div>
                  </div>
                </React.Fragment>
              </Popup>}
              <a ref={this.download}></a>
              <div className="title">Transactions</div>
              {hasOtherTxs &&
                <div className="filter">
                  {hasRefreshBtn && <span className="refresh" onClick={this.handleTxsRefresh}>&#x21bb;</span>}
                  Display
                  <Multiselect
                    options={typeOptions || TypeOptions} // Options to display in the dropdown
                    displayValue="label" // Property name to display in the dropdown options
                    style={{
                      multiselectContainer: { width: "200px", marginLeft: '5px', marginRight: '5px' },
                      searchBox: { maxHeight: '35px', overflow: 'hidden', padding: 0 },
                      optionContainer: { background: '#1b1f2a' },
                      inputField: { margin: 0, height: '100%', width: '100%' },
                      chips: { display: 'none' }
                    }}
                    onSelect={this.handleSelect}
                    onRemove={this.handleSelect}
                    closeOnSelect={false}
                    showCheckbox={true}
                    avoidHighlightFirstOption={true}
                    placeholder={`${this.state.selectedTypes.length} selected types`}
                    selectedValues={this.state.selectedTypes}
                  />
                  Txs
                </div>
              }

            </div>
            <div>
              {loading_txns &&
                <LoadingPanel className="fill" />}
              <TransactionTable transactions={transactions} account={account} price={price} />
            </div>
            <Pagination
              size={'lg'}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={this.handlePageChange}
              disabled={loading_txns} />
          </React.Fragment>}
        {account.code && account.code !== '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' &&
          <SmartContract address={account.address} />}
      </div>);
  }
}

const Balance = ({ balance, price }) => {
  return (
    <div className="act balance">
      {map(balance, (v, k) => <div key={k} className={cx("currency", k)}>
        {`${formatCoin(v)} ${CurrencyLabels[k] || k}`}
        <div className='price'>{`[\$${priceCoin(v, price[CurrencyLabels[k]])} USD]`}</div>
      </div>)}
    </div>)
}

const Address = ({ hash }) => {
  return (<Link to={`/account/${hash}`} target="_blank">{hash}</Link>)
}

const HashList = ({ hashes }) => {
  return (
    <React.Fragment>
      {map(compact(hashes), (hash, i) => <div key={i}><Link key={hash} to={`/txs/${hash.toLowerCase()}`}>{hash.toLowerCase()}</Link></div>)}
    </React.Fragment>
  )
}

