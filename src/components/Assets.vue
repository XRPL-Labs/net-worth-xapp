<template>
    <h4>{{ $t('xapp.headers.portfolio_balance') }}</h4>
    <h2 class="number" @click="changeCurrency">{{ activeCurrency === 'XRP' ? $xapp.currencyFormat(totalXRPValue, activeCurrency) : $xapp.currencyFormat(totalXRPValue / 1_000_000 * rate, activeCurrency) }} {{ activeCurrency }}</h2>
    <div id="asset-container" class="column">
        <ul>
            <li class="asset">
                <img :src="'https://user-images.githubusercontent.com/1287855/42951396-f1d82368-8b2a-11e8-9855-e20630fc1dc0.png'">
                <div class="row">
                    <h5>XRP</h5>
                    <h5 v-if="activeCurrency === 'XRP'" class=" pushnumber">{{ $xapp.currencyFormat($xapp.getAccountData().account_data.Balance, 'XRP') }} XRP</h5>
                    <div v-else class="asset-values" style="margin-left: auto">
                        <h5 class="push number">{{ $xapp.currencyFormat($xapp.getAccountData().account_data.Balance * rate / 1_000_000, activeCurrency) }} {{ activeCurrency }}</h5>
                        <h6 class="push number">{{ $xapp.currencyFormat($xapp.getAccountData().account_data.Balance, 'XRP') }} XRP</h6>
                    </div>
                </div>
            </li>
            <li class="asset" v-for="(item, currency, index) in accountCurrencies">
                <!-- {{ Object.keys(curatedAssets).length > 0 }} -->
                <div v-if="ready && !loading" class="row">
                    <img :src="getFirstObject(curatedCurrencies[currency], 'avatar') ? getFirstObject(curatedCurrencies[currency], 'avatar') : 'https://user-images.githubusercontent.com/1287855/42951396-f1d82368-8b2a-11e8-9855-e20630fc1dc0.png'">
                    <div class="row">
                        <h5>{{ getFirstObject(curatedCurrencies[currency], 'name') ? getFirstObject(curatedCurrencies[currency], 'name') : $xapp.currencyCodeFormat(currency, 16) }}</h5>
                        <h5 v-if="activeCurrency === currency" class="push number">{{ $xapp.currencyFormat(calculateAssetValue(currency), currency) }} {{ $xapp.currencyCodeFormat(currency, 4) }}</h5>
                        <div v-else class="asset-values" style="margin-left: auto">
                            <h5 class="push number">{{ activeCurrency === 'XRP' ? $xapp.currencyFormat(accountCurrencies[currency].value * 1_000_000, 'XRP') : $xapp.currencyFormat(accountCurrencies[currency].value * rate, activeCurrency) }} {{ activeCurrency }}</h5>
                            <h6 class="push number">{{ $xapp.currencyFormat(calculateAssetValue(currency), currency) }} {{ $xapp.currencyCodeFormat(currency, 4) }}</h6>
                        </div>
                    </div>
                </div>
                <div class="row" v-else>
                    <ContentLoader
                        primaryColor="#383838"
                        secondaryColor="#242424"
                        :heigt="60"
                        :width="68"
                        preserveAspectRatio="xMidyMid"
                        viewBox="0 0 68 60"
                        >
                        <circle cx="12.5" cy="30" r="12.5" />
                        <rect x="35" y="21" rx="3" ry="3" width="33" height="18" />
                    </ContentLoader>
                    <ContentLoader
                        primaryColor="#383838"
                        secondaryColor="#242424"
                        :width="150"
                        :height="60"
                        viewBox="0 0 150 60"
                        >
                        <rect x="30" y="5" rx="4" ry="4" width="100" height="13" />
                        <rect x="40" y="35" rx="4" ry="4" width="100" height="10" />
                    </ContentLoader>
                </div>              
            </li>
            <!-- TEST PURPOSES -->
            <!-- <li class="asset" v-for="i in 10">
                <img :src="'https://user-images.githubusercontent.com/1287855/42951396-f1d82368-8b2a-11e8-9855-e20630fc1dc0.png'">
                <div class="column">
                    <div class="row">
                        <h5>TEST CURRENCY</h5>
                        <h5 class="number">1.123456</h5>
                    </div>
                    <div class="row">
                        <h6>TEST</h6>
                        <h6 class="number">123</h6>
                    </div>
                </div>
            </li> -->
        </ul>
    </div>
</template>

<script>
import svgImg from '@/components/svg.vue'
import axios from 'redaxios'

import { LiquidityCheck } from 'xrpl-orderbook-reader'
import { ContentLoader } from 'vue-content-loader'

export default {
    components: { svgImg, ContentLoader },
    data() {
        return {
            loading: true,
            ready: false,
            curatedAssets: {},
            tokens: [],
            accountCurrencies: {},
            activeCurrency: 'XRP',
            fiatCurrency: 'USD',
            rate: 1
        }
    },
    watch: {
        accountCurrencies: {
            handler: function(newVal, oldVal) {
                this.getExchangeRate(this.fiatCurrency)
            },
            deep: true
        },
    },
    computed: {
        totalXRPValue(){
            let value = Number(this.$xapp.getAccountData().account_data.Balance) || 0
            for(const currency in this.accountCurrencies) {
                if(this.accountCurrencies[currency].value) {
                    value = Number(value + this.accountCurrencies[currency].value * 1_000_000)
                }
            }
            return value
        },
        issuers() {
            const obj = this.currencyObject[this.selectedCurrency]
            return obj
        },
        curatedCurrencies() {
            const obj = {}

            for(const exchange in this.curatedAssets.details) {
                // If exchange is on short list continue else continue
                if(!this.curatedAssets.details[exchange].shortlist) continue
                for(const currency in this.curatedAssets.details[exchange].currencies) {
                    const details = this.curatedAssets.details[exchange].currencies[currency]
                    if(!details.shortlist) continue
                    
                    const issuer = details.issuer

                    if(typeof obj[currency] === 'undefined') {
                        obj[currency] = {
                           [issuer]: details
                        }
                    } else {
                        obj[currency][issuer] = details
                    }
                }
            }
            return obj
        },
    },
    methods: {
        async getExchangeRate(currency) {
            const res = await this.$rippled.send({
                "command": "account_tx",
                "account": "rXUMMaPpZqPutoRszR29jtC8amWq3APkx",
                "ledger_index_min": -1,
                "ledger_index_max": -1,
                "limit": 1
            })
            // console.log(Number(res.transactions[0].tx.LimitAmount.value))
            this.rate = Number(res.transactions[0].tx.LimitAmount.value)
        },
        changeCurrency() {
            this.activeCurrency = this.activeCurrency === 'XRP' ? 'USD' : 'XRP'
        },
        accountTrustlines() {
            const accData = this.$xapp.getAccountData()
            if (!accData) return {}
            const array = accData.lines
            const obj = {}

            if(Array.isArray(array) && array.length > 0) {
                array.forEach(line => {
                    if(typeof obj[line.currency] === 'undefined') {
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
            for(const line in this.accountCurrencies[currency]) {
                if(this.accountCurrencies[currency][line].balance > 0 && typeof this.accountCurrencies[currency][line].balance === 'string') {
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
            for(const element in obj) {
                return obj[element][key]
            }
        },
        async bookOffers(currency, issuer, amount) {
            const orders = new LiquidityCheck({
                trade: {
                    from: {
                        currency: currency,
                        issuer: issuer
                    },
                    to: {
                        currency: 'XRP'
                    },
                    amount: amount
                },
                options: {
                    rates: 'to'
                },
                method: this.$rippled.send
            })
            const orderBookObj = await orders.get()
            this.accountCurrencies[currency][issuer]['rate'] = orderBookObj.rate
            if(typeof this.accountCurrencies[currency].value === 'undefined') {
                this.accountCurrencies[currency]['value'] = parseFloat(this.accountCurrencies[currency][issuer].balance) * orderBookObj.rate
            } else {
                this.accountCurrencies[currency].value = this.accountCurrencies[currency].value + parseFloat(this.accountCurrencies[currency][issuer].balance) * orderBookObj.rate
            }
        },
    },
    async created() {
        this.accountTrustlines()
        try {
            this.curatedAssets = await this.$xapp.getCuratedAssets()
        } catch(e) {
            this.$emitter.emit('modal', {
                type: 'error',
                title: this.$t('xapp.error.modal_title'),
                text: this.$t('xapp.error.get_curated_assets'),
                buttonText: this.$t('xapp.button.close')
            })
        }

        try {
            const res = await fetch('https://tokens.xumm.community/api/v1/tokens')
            // const res = await axios.get('https://tokens.xumm.community/api/v1/tokens')
            this.tokens = res.tokens
        } catch(e) {
            // alert('error with nixer API')
            // alert(e)
        }
        this.loading = false
    },
    async mounted() {
        const accData = this.$xapp.getAccountData()
        if (!accData) return {}
        const array = accData.lines

        const dataFunctions = []
        array.forEach(line => {
            if(line.balance > 0) {
                dataFunctions.push( this.bookOffers(line.currency, line.account, line.balance) )
            } else {

            }
        })

        await Promise.all(dataFunctions)
        this.ready = true
    }
}
</script>

<style scoped>
#asset-container {
    padding: 25px 0 80px 0;
}
#asset-container::-webkit-scrollbar {
  display: none;
}
.asset-values {
    display: flex;
    flex-direction: column;
}
.push {
    margin-left: auto !important;
}
h2 {
    margin: 0;
}
h4 {
    margin: 0;
    font-size: 13px;
    text-align: center;
    margin-top: 14px;
}
h5 {
    margin: 0;
    font-size: 18px;
    font-weight: 200;
}
h6 {
    margin: 0;
    font-size: 15px;
    font-weight: 100;
}
img {
    width: 25px;
    height: 25px;
    object-fit: cover;
    margin-right: 10px;
}
.row {
    justify-content: space-between;
}
.asset {
    display: flex;
    flex-direction: row;
    /* border: 1px solid white; */
    align-items: center;
    padding: 10px;
    height: 40px;
    margin: 10px 0;
}
.asset .row {
    margin: 0;
}
#asset-container {
    height: 100vh;
    overflow: auto;
}
ul {
  list-style-type: none;
  margin: 0;
  padding: 15px;
  font-size: 15px;
  table-layout: fixed;
  display: table;
  width: 90%;
  align-self: center;
  border: 1px solid var(--var-border);
  border-radius: 15px;
  /* color: var(--var-txt-color); */
}
li {
    /* border-bottom: 1px solid var(--var-border);
    padding: 4px 0; */
    display: table-cell;
}
</style>