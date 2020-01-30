import './App.css'
import React, { Component, ReactNode, ChangeEvent } from 'react'
import { JsonRpcProvider } from 'ethers/providers'
import axios from 'axios'
import Token from './Token'
import { AddressInfo, TokenData } from './interfaces'
import { isRegistered } from './util'

type TokenListProps = {
  provider?: JsonRpcProvider
}

type TokenListState = {
  address: string
  tokens: TokenData[]
  useT2CR: boolean
}

class TokenList extends Component<TokenListProps, TokenListState> {
  state: TokenListState = {
    address: '0x0000000000000000000000000000000000000000',
    tokens: [],
    useT2CR: true,
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: TokenListProps) {
    if (this.props.provider === prevProps.provider) return
    this.loadData()
  }

  async loadData() {
    if (!this.props.provider) return

    // Get address from Metamask
    const address = (await this.props.provider.listAccounts())[0]

    // Retrieve token balances from the Ethplorer and sort them alphabetically
    const result = await axios.get(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`)
    const addressInfo: AddressInfo = result.data

    let tokens = !addressInfo.tokens
      ? []
      : addressInfo.tokens
        .filter(t => t.balance > 0)
        .sort((a: any, b: any) => a.tokenInfo.symbol.localeCompare(b.tokenInfo.symbol))

    tokens = await Promise.all(tokens.map(async token => {
      token.registered = await isRegistered(token.tokenInfo.address, this.props.provider)
      return token
    }))

    this.setState({ tokens, address, ensName })
  }

  handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) =>
    this.setState({ useT2CR: event.target.checked })

  render(): ReactNode {
    return (
      <div className="TokenList">
        <h4>Address: {this.state.address}</h4>
          <p>
          Filter out unregistered tokens
          <sup><a href="https://tokens.kleros.io/tokens" target="_blank" rel="noopener noreferrer">?</a></sup>
          <input type="checkbox" checked={this.state.useT2CR} onChange={this.handleCheckboxChange} />
        </p>
        <ul>
          {this.state.tokens.length > 0
            ? this.state.tokens.map(t => (
              (!this.state.useT2CR || t.registered) &&
              <Token key={t.tokenInfo.symbol} token={t} provider={this.props.provider} address={this.state.address} />
            ))
            : 'No token balances'
          }
        </ul>
      </div>
    )
  }
}

export default TokenList;
