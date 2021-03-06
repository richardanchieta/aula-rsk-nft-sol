import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Color from './contracts/Color.json';

function colorHexToString(hexStr) {
  return '#' + hexStr.substring(2);
}

function colorStringToBytes(str) {
  if (str.length !== 7 || str.charAt(0) !== '#') {
    throw new Error('invalid color string');
  }
  const hexStr = '0x' + str.substring(1);
  return Web3.utils.hexToBytes(hexStr);
}

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      account: '',
      contract: null,
      totalSupply: 0,
      colors: [],
      ownerOf: '',
      addressTo: ''
    };
  }

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      // current web3 providers
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    else if (window.web3) {
      // fallback for older web3 providers
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      // no web3 provider, user needs to install one in their browser
      window.alert(
        'No injected web3 provider detected');
    }
    console.log(window.web3.currentProvider);
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();
    console.log ('account: ', accounts[0]);
    this.setState({ account: accounts[0] });
    const networkId = await web3.eth.net.getId();
    const networkData = Color.networks[networkId];

    if (!networkData) {
      window.alert('Smart contract not deployed to detected network.');
      return;
    }
    

    const abi = Color.abi;
    const address = networkData.address;
    const contract = new web3.eth.Contract(abi, address);
    this.setState({ contract });

    const ownerOf = await contract.methods.ownerOf(0).call()
    console.log('ownerOf', ownerOf);
    this.setState({ ownerOf });

    const totalSupply = await contract
      .methods.totalSupply().call();
    this.setState({ totalSupply });

    // Load Colors
    for (var i = 1; i <= totalSupply; i++) {
      const colorBytes = await contract
        .methods.colors(i - 1).call();
      const colorStr = colorHexToString(colorBytes);
      this.setState({
        colors: [...this.state.colors, colorStr],
      });
    }

    
  }

  mint = (colorStr) => {
    const colorBytes = colorStringToBytes(colorStr);
    this.state.contract.methods
      .mint(colorBytes)
      .send({ from: this.state.account })
      .once('receipt', (receipt) => {
        console.log ('transaction receipt: ', receipt)
        this.setState({
          colors: [...this.state.colors, colorStr],
        });
      });
  }

  transferOwnership = (addressTo) => {
    this.state.contract.methods
      .transferFrom(this.state.account, addressTo.toLowerCase(), 0)
      .send({ from: this.state.account })
      .once('receipt', (receipt) => {
        console.log ('transaction receipt: ', receipt)
        this.setState({
          colors: [this.state.addressTo, addressTo],
        });  
      });
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <span className="navbar-brand col-sm-3 col-md-2 mr-0">
            Color Tokens
          </span>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white"><span id="account">{this.state.account}</span></small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>Issue Token</h1>
                <form onSubmit={(event) => {
                  event.preventDefault();
                  const colorStr = this.color.value;
                  this.mint(colorStr);
                }}>
                  <input
                    type='text'
                    className='form-control mb-1'
                    placeholder='e.g. #FF00FF'
                    ref={(input) => { this.color = input }}
                  />
                  <input
                    type='submit'
                    className='btn btn-block btn-primary'
                    value='MINT'
                  />
                </form>
              </div>
            </main>
          </div>

          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>Transfer ownership</h1>
                <p>(current: { this.state.ownerOf })</p>
                <form onSubmit={(event) => {
                  event.preventDefault();
                  const addressTo = this.addressTo.value;
                  this.transferOwnership(addressTo);
                }}>
                  <input
                    type='text'
                    className='form-control mb-1'
                    placeholder='e.g. 0x34bd51dbe17b202A2C020FBC6471a3Db468c1EC9'
                    ref={(input) => { this.addressTo = input }}
                  />
                  <input
                    type='submit'
                    className='btn btn-block btn-primary'
                    value='TRANSFER'
                  />
                </form>
              </div>
            </main>
          </div>

          <hr/>
          <div className="row text-center">
            { this.state.colors.map((colorStr, key) => {
              return (
                <div key={key} className="col-md-3 mb-3">
                  <div className="token" style={{ backgroundColor: colorStr }}></div>
                  <div>{colorStr}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
