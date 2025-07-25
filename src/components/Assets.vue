<template>
  <div class="account-card">
    <h3>{{ $t('xapp.headers.account_address') }}</h3>
    <div class="address" @click="$emitter.emit('account-change')">
      <span class="dot" :class="[{online: online}, {offline: !online}]"></span>
      <span class="mono">{{ account }}</span>
    </div>
    <h3>
      {{ $t('xapp.headers.total_value') }}
      <button class="btn btn-sm explain" @click="$emitter.emit('info-overlay', { header: $t('xapp.headers.info_value'), body: $t('xapp.body.info_value') })">
        <fa :icon="['fas', 'info-circle']" />
        {{ $t('xapp.headers.explain_value') }}
      </button>
    </h3>
    <h2 v-if="activeCurrency !== $rippled.asset()" class="mono" @click="changeCurrency()">
      {{ activeCurrencySymbol }}{{ $xapp.currencyFormat((totalXRPValue / 1_000_000) * rate, activeCurrency) }}
      <small>1 {{ $rippled.asset() }} = {{ rate }} {{ activeCurrency }}</small>
    </h2>
    <h2 v-else class="mono" @click="changeCurrency()">{{ $xapp.currencyFormat(totalXRPValue, $rippled.asset()) }} {{ $rippled.asset() }}</h2>
  </div>

  <div id="asset-container" class="column">
    <ul>
      <li class="asset">
        <img src="../assets/png/crypto-xrp.png" class="currencyicon xrp" />
        <div class="assetandvalue">
          <h5>{{ $rippled.asset() }}</h5>
          <span class="mono">{{ $xapp.currencyFormat($xapp.getAccountData().account_data.Balance, $rippled.asset()) }} {{ $rippled.asset() }}</span>
        </div>
        <span class="mono big">
          {{
            activeCurrency !== $rippled.asset()
              ? $xapp.currencyFormat(($xapp.getAccountData().account_data.Balance * rate) / 1_000_000, activeCurrency)
              : $xapp.currencyFormat($xapp.getAccountData().account_data.Balance, $rippled.asset())
          }}
          {{ activeCurrency }}
        </span>
      </li>
      <li class="asset" v-for="(item, index) in accountCurrenciesList" :key="index" @click="showDetails(item.currency, item)">
        <template v-if="(!loading && item.init === true) || ready">
          <img v-if="getFirstObject(curatedCurrencies[item.currency], 'avatar')" :src="getFirstObject(curatedCurrencies[item.currency], 'avatar')" class="currencyicon" />
          <img v-else src="../assets/png/trustline-unkown.png" class="currencyicon xrp" />
          <div class="assetandvalue">
            <h5>
              {{
                getFirstObject(curatedCurrencies[item.currency], 'name')
                  ? getFirstObject(curatedCurrencies[item.currency], 'name')
                  : $xapp.currencyCodeFormat(item.currency, 16)
              }}
            </h5>
            <span v-if="activeCurrency !== item.currency" class="mono"
              >{{ $xapp.currencyFormat(calculateAssetValue(item.currency), item.currency) }} {{ $xapp.currencyCodeFormat(item.currency, 4) }}</span
            >
          </div>
          <span class="mono big">
            {{
              activeCurrency === $rippled.asset()
                ? $xapp.currencyFormat(item.value * 1_000_000, $rippled.asset())
                : $xapp.currencyFormat(item.value * rate, activeCurrency)
            }}
            {{ activeCurrency }}
          </span>
        </template>
        <div class="cloader" v-else>
          <content-loader :height="40" :width="400" :speed="2" primaryColor="#f3f3f3" secondaryColor="#dfdddd">
            <rect x="9.5" y="6.27" rx="0" ry="0" width="39" height="39" />
            <rect x="64.5" y="9.27" rx="0" ry="0" width="81" height="14.04" />
            <rect x="63.5" y="28.27" rx="0" ry="0" width="123.12" height="14.04" />
            <rect x="295.55" y="14.27" rx="0" ry="0" width="88.29" height="19.98" />
          </content-loader>
        </div>
      </li>
    </ul>
  </div>

  <Details :activeCurrency="activeCurrency" :rate="rate" />
  <InfoOverlay />
</template>

<script>
import Details from '@/components/AssetDetails.vue'
import svgImg from '@/components/svg.vue'
import fetch from 'node-fetch'
import {LiquidityCheck} from 'xrpl-orderbook-reader'
import {ContentLoader} from 'vue-content-loader'
import InfoOverlay from './InfoOverlay.vue'

export default {
  components: {svgImg, ContentLoader, Details, InfoOverlay},
  data() {
    return {
      loading: true,
      ready: false,
      curatedAssets: {},
      tokens: [],
      accountCurrencies: {},
      activeCurrencySymbol: '$',
      activeCurrency: 'USD',
      fiatCurrency: 'USD',
      rate: 0,
      online: false,
      nodeType: 'MAINNET'
    }
  },
  computed: {
    accountCurrenciesList() {
      return  Object.entries(this.accountCurrencies)
                .map(item => {
                  return { currency: item[0], ...item[1] }
                })
                .sort((a, b) => b.value - a.value)
    },
    account() {
      return this.$xapp.getAccount()
    },
    totalXRPValue() {
      try {
        let value = Number(this.$xapp.getAccountData().account_data.Balance) || 0
        for (const currency in this.accountCurrencies) {
          if (this.accountCurrencies[currency].value) {
            value = Number(value + this.accountCurrencies[currency].value * 1_000_000)
          }
        }
        return value
      } catch(e) {

      }
    },
    curatedCurrencies() {
      const obj = {}

      for (const exchange in this.curatedAssets.details) {
        // If exchange is on short list continue else continue
        if (!this.curatedAssets.details[exchange].shortlist) continue
        for (const currency in this.curatedAssets.details[exchange].currencies) {
          const details = this.curatedAssets.details[exchange].currencies[currency]

          const issuer = details.issuer

          if (typeof obj[currency] === 'undefined') {
            obj[currency] = {
              [issuer]: details
            }
          } else {
            obj[currency][issuer] = details
          }
        }
      }
      return obj
    }
  },
  methods: {
    async checkConnection() {
      setInterval(() => {
        this.online = this.$rippled.getState().online
      }, 1000)
    },
    showDetails(currency, lines) {
      const header = {
        title: this.getFirstObject(this.curatedCurrencies[currency], 'name') || this.$xapp.currencyCodeFormat(currency, 16),
        img: this.getFirstObject(this.curatedCurrencies[currency], 'avatar') || undefined,
        currency: currency,
        value: lines.value,
        balance: this.calculateAssetValue(currency)
      }
      const array = []
      for (const line in lines) {
        if (lines[line].balance) {
          const obj = {
            issuer: line,
            value: lines[line].balance
          }
          array.push(obj)
        }
      }
      this.$emitter.emit('details', {header: header, lines: array})
    },
    async getExchangeRate(currency) {
      try {
        const res = await this.$xapp.getCurrencyRates(currency)
        this.rate = res[this.$rippled.asset()] || 0
        console.log('rate', currency, this.rate)
        this.activeCurrencySymbol = res.__meta.currency.symbol
      } catch(e) {
        this.$emitter.emit('modal', {
          type: 'error',
          title: this.$t('xapp.error.modal_title'),
          text: this.$t('xapp.error.get_exchange_rate'),
          buttonText: this.$t('xapp.button.close')
        })
      }
    },
    changeCurrency() {
      this.activeCurrency = this.activeCurrency === this.$rippled.asset() ? 'USD' : this.$rippled.asset()
    },
    accountTrustlines() {
      const accData = this.$xapp.getAccountData()
      if (!accData) return {}
      const array = accData.lines
      const obj = {}

      if (Array.isArray(array) && array.length > 0) {
        array.forEach((line) => {
          if (typeof obj[line.currency] === 'undefined') {
            obj[line.currency] = {
              [line.account]: line
            }
          } else {
            obj[line.currency][line.account] = line
          }
        })
      }
      this.accountCurrencies = obj
    },
    calculateAssetValue(currency) {
      let value = 0
      for (const line in this.accountCurrencies[currency]) {
        if (this.accountCurrencies[currency][line].balance > 0 && typeof this.accountCurrencies[currency][line].balance === 'string') {
          value = value + parseFloat(this.accountCurrencies[currency][line].balance)
        }
      }
      return value
    },
    getIssuerName(issuer) {
      this.$xapp.getIssuerName(issuer)
    },
    openIssuerSelect(line) {
      this.issuerSelect = true
      this.selectedCurrency = line
    },
    getFirstObject(obj, key) {
      // [Object.keys(curatedCurrencies[currency])[0]]
      for (const element in obj) {
        return obj[element][key]
      }
    },
    async bookOffers(currency, issuer, amount) {
      if(Number(amount) !== 0) {
        const dataApiRates =
          this.nodeType === 'MAINNET'
          ? fetch('https://xrpldata.inftf.org/v1/iou/exchange_rates/XRP/' + issuer + '_' + currency).then(f => f.json()).catch(e => console.log('data api error', e.message))
          : this.nodeType === 'XAHAU'
          ? fetch('https://data.xahau.network/v1/iou/exchange_rates/XAH/' + issuer + '_' + currency).then(f => f.json()).catch(e => console.log('data api error', e.message))
          : Promise.resolve({ rate: null, })

        console.log('bookoffers', currency, issuer, amount)
        const orders = new LiquidityCheck({
          trade: {
            from: {
              currency: currency,
              issuer: issuer
            },
            to: {
              currency: 
                this.nodeType === 'XAHAU'
                  ? 'XAH'
                  : 'XRP'
            },
            amount: amount
          },
          options: {
            rates: 'to'
          },
          method: this.$rippled.send
        })
        
        const [orderBookObj, dataApiRate] = await Promise.all([
          orders.get(),
          dataApiRates,
        ])

        // const orderBookObj = await orders.get()
        // const dataApiRate = await dataApiRates
        
        const useRate = dataApiRate?.rate
          ? 1 / dataApiRate.rate
          : orderBookObj.rate

        // const useRate = orderBookObj.rate
        // const useRate = 1 / dataApiRate.rate
        // console.log('apirate, bookrate', issuer, currency, 1 / dataApiRate.rate, orderBookObj.rate, { useRate, })
        
        this.accountCurrencies[currency][issuer]['rate'] = useRate
        if (typeof this.accountCurrencies[currency].value === 'undefined') {
          this.accountCurrencies[currency]['value'] = parseFloat(this.accountCurrencies[currency][issuer].balance) * useRate
        } else {
          this.accountCurrencies[currency].value = this.accountCurrencies[currency].value + parseFloat(this.accountCurrencies[currency][issuer].balance) * useRate
        }
      }

      if(typeof this.accountCurrencies[currency] !== 'undefined') this.accountCurrencies[currency]['init'] = true
      else this.accountCurrencies[currency] = { init: true }
    },
    async init() {
      const ott = await this.$xapp.getTokenData()
      this.nodeType = (ott?.nodetype || 'MAINNET').toUpperCase()
      this.fiatCurrency = ott.currency || 'USD'
      this.activeCurrency = ott.currency || 'USD'
      this.getExchangeRate(this.fiatCurrency)
      
      this.accountTrustlines()
      this.checkConnection()
      const accData = this.$xapp.getAccountData()
      if (!accData) return {}
      const array = accData.lines

      const dataFunctions = []
      array.forEach((line) => {
        const r = this.bookOffers(line.currency, line.account, line.balance)
        console.log(this.nodeType)
        dataFunctions.push(r)
      })

      try {
        await Promise.all(dataFunctions)
      } catch(e) {
        console.log(e)
      }
      this.ready = true
    }
  },
  async created() {
    this.$emitter.on('accountChange', () => {
      this.ready = false
      this.init()
    })
    try {
      this.curatedAssets = await this.$xapp.getCuratedAssets()
    } catch (e) {
      this.$emitter.emit('modal', {
        type: 'error',
        title: this.$t('xapp.error.modal_title'),
        text: this.$t('xapp.error.get_curated_assets'),
        buttonText: this.$t('xapp.button.close')
      })
    }
    this.loading = false
  },
  mounted() {
    this.init()
  }
}
</script>

<style scoped>
img.currencyicon {
  width: 2.3rem;
  height: 2.3rem;
  object-fit: cover;
  margin-right: 10px;
  border: 1px solid var(--var-darker);
  border-radius: 0.5rem;
}
img.currencyicon.xrp {
  width: 2.3rem;
  height: 2.3rem;
  object-fit: cover;
  margin-right: 10px;
  border: 1px solid var(--var-darker);
  border-radius: 0.5rem;
}
.account-card {
  background: var(--var-tint-color);
  border-radius: 1rem;
  padding: 1rem;
  /* height: 4rem; */
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}
.account-card h3 {
  font-weight: 700 !important;
  font-family: proxima-nova, sans-serif;
  margin: 0 0 0.2rem 0;
  color: var(--var-grey);
  font-size: 0.9rem;
}
.account-card .btn.explain {
  padding: 0 0.2rem;
  float: right;
  border: none;
  background: none;
  margin-bottom: 0.2rem;
  color: var(--var-txt-color);
}
.account-card h2.mono {
  font-weight: 700 !important;
  font-family: proxima-nova, sans-serif;
  background: var(--var-darker);
  border-radius: 0.5rem;
  text-align: center;
  padding: 0.5rem 1rem;
  margin: 0;
  font-size: 1.7rem;
}
.account-card h2.mono small {
  display: block;
  font-size: 0.8rem;
  margin-top: 0.1rem;
  color: var(--var-grey);
}
#asset-container {
  flex-grow: 1;
  overflow-x: hidden;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  /* border: 1px solid purple; */
}
.cloader {
  margin-left: -0.5rem;
}

.address {
  /* display: flex; */
  /* flex-direction: row; */
  /* justify-content: flex-start; */
  /* align-items: center; */
  margin-bottom: 0.7rem;

  background: var(--var-darker);
  border-radius: 0.5rem;
  text-align: center;
  padding: 0.5rem 1rem;
  font-weight: bold;
  /* font-size: 1.5rem; */
  /* border: 2px solid red; */
}
.address span.mono {
  font-size: 0.9rem;
}
.address span.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: white;
  display: inline-block;
  margin-right: 5px;
  vertical-align: middle;
  margin-top: -1px;
}
.address span.dot.online {
  background-color: var(--var-green);
}
.address span.dot.offline {
  background-color: var(--var-red);
}
.asset-values {
  border: 1px solid red;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  /* padding: 15px; */
  font-size: 15px;
  /* table-layout: fixed; */
  display: flex;
  flex-direction: column;
  /* border: 1px solid red; */
  /* width: 90%; */
  /* align-self: center; */
  /* border: 1px solid var(--var-border); */
  /* border-radius: 15px; */
  /* color: var(--var-green); */
}
ul li.asset {
  padding: 0.5rem 0.5rem;
  width: calc(100% - 1rem);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
ul li.asset .assetandvalue {
  text-align: left;
  flex: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
ul li.asset .assetandvalue h5 {
  font-size: 0.9rem;
  margin: 0;
  font-weight: bold;
}
ul li.asset .assetandvalue .mono {
  color: var(--var-grey);
}

ul li.asset .mono.big {
  margin-left: auto;
  font-size: 1.1rem;
  font-weight: bold;
}
</style>
