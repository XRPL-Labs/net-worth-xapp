<template>
  <div v-show="active" @click.self="active = false" class="overlay">
    <div id="overlay-element">
      <div class="overlay-header">
        <img v-if="header.img" :src="header.img" class="currencyicon xrp" />
        <h3>{{ header.title }}</h3>
        <button @click="active = false" class="btn btn-link"><fa :icon="['fas', 'times']" /></button>
      </div>

      <ul>
        <li v-for="(item, issuer, index) in lines" :key="index">
          <img v-if="getDetails(header.currency, item.issuer).avatar" :src="getDetails(header.currency, item.issuer).avatar" class="currencyicon xrp" />
          <img v-else src="../assets/png/trustline-unkown.png" class="currencyicon xrp" />
          <div class="assetandvalue">
            <h5>
              {{ getDetails(header.currency, item.issuer).name || sliceAddress(item.issuer) }}
            </h5>
            <span class="mono">{{ $xapp.currencyFormat(item.value, header.currency) }} {{ $xapp.currencyCodeFormat(header.currency, 4) }}</span>
          </div>
        </li>
      </ul>
      <!-- <h2 class="total">{{ $t('xapp.headers.totals') }}</h2> -->
      <h3 class="mono big">
        {{ $xapp.currencyFormat(header.balance, header.currency) }} {{ $xapp.currencyCodeFormat(header.currency, 4) }}
        <small>1 {{ $xapp.currencyCodeFormat(header.currency, 4) }} = {{ priceFormat(activeCurrency === $rippled.asset() ? header.value / header.balance : (header.value * rate) / header.balance) }} {{ activeCurrency }}</small>
      </h3>
      <h3 class="mono big" v-if="activeCurrency !== header.currency">
        {{ activeCurrency === $rippled.asset() ? $xapp.currencyFormat(header.value * 1_000_000, $rippled.asset()) : $xapp.currencyFormat(header.value * rate, activeCurrency) }} {{ activeCurrency }}
        <small>1 {{ activeCurrency }} = {{ priceFormat(activeCurrency === $rippled.asset() ?  header.balance / header.value : header.balance / (header.value * rate) )}} {{ $xapp.currencyCodeFormat(header.currency, 4) }}</small>
      </h3>
    </div>
  </div>
</template>

<script>
export default {
  props: ['activeCurrency', 'rate'],
  data() {
    return {
      active: false,
      header: {
        currency: 'USD',
        value: '0'
      },
      lines: {}
    }
  },
  computed: {
    items() {
      const array = []
      for (const line in this.lines) {
        const obj = {}
        if (this.lines[line].balance) {
          array.push(obj)
        }
      }
    }
  },
  methods: {
    sliceAddress(account) {
      return `${account.slice(0, 14)}...${account.slice(-8)}`
    },
    getDetails(currency, issuer) {
      const details = this.$xapp.getAssetDetails(currency, issuer)
      return details
    },
    priceFormat(value) {
      if(isNaN(value)) return '0'
      const int = Math.trunc(value)
      const length = value.toString().length
      let decimals = 2
      if(length > 1) {
          decimals = 2
      } else {
          if(int < 1) {
              decimals = 4
          } else {
              decimals = 3
          }
      }
      if(value < 1) return value.toPrecision(decimals)
      const integerLength = (value.toFixed(0)).length
      return value.toPrecision(decimals + integerLength)
    }
  },
  async created() {
    this.$emitter.on('details', (obj) => {
      this.header = obj.header
      this.lines = obj.lines
      this.active = true
    })
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--var-overlay);
  z-index: 99;
}
#overlay-element {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--var-bg-color);
  width: 85%;
  /* height: 300px; */
  height: 70%;
  padding: 1rem;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.overlay-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
.overlay-header img {
  margin-left: 1rem;
}
.overlay-header h3 {
  margin-left: 0.1rem;
}
.overlay-header .btn {
  margin-left: auto;
  color: var(--var-txt-color);
}
.overlay-header .btn svg {
  transform: scale(1.5);
  vertical-align: middle;
  margin: 0;
  padding: 0;
}
ul {
  list-style-type: none;
  margin: 0;
  padding: 0.5rem;
  font-size: 15px;
  height: 100%;
  overflow: auto;
  width: calc(100% - 1rem);
  align-self: center;
  color: var(--var-txt-color);
  background: var(--var-tint-color);
  /* border-top: 2px solid var(--var-silver); */
  /* border-bottom: 2px solid var(--var-silver); */
  border-radius: 1rem;
}
li {
  border-bottom: 1px solid var(--var-border);
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}
li:last-child {
  border: none;
}
li h5 {
  margin: 0.1rem 0 0.2rem 0;
}
h2.total {
  margin: 0.5rem 0;
}
h3.mono.big {
  width: 90%;
  font-weight: 700 !important;
  font-family: proxima-nova, sans-serif;
  background: var(--var-tint-color);
  border-radius: 0.5rem;
  text-align: center;
  padding: 0.5rem 1rem;
  margin: 0.5rem 1rem 0 1rem;
  font-size: 1.7rem;
}
h3.mono.big small {
  display: block;
  font-size: 0.8rem;
  margin-top: 0.1rem;
  color: var(--var-grey);
}
.imgandasset {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}
img.currencyicon {
  width: 3.1rem;
  height: 3.1rem;
  object-fit: cover;
  margin-right: 10px;
  border: 2px solid var(--var-daker);
  border-radius: 0.5rem;
}
img.currencyicon.xrp {
  width: 1.3rem;
  height: 1.3rem;
  object-fit: cover;
  margin-right: 10px;
  border: 2px solid var(--var-darker);
  border-radius: 0.5rem;
  background: var(--var-darker);
}
</style>
