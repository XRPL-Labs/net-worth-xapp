<template>
    <div v-show="active" @click.self="active = false" class="overlay">
        <div id="overlay-element">
            <div class="column">
                <div class="row">
                    <div style="margin: auto; display: flex; flex-direction: row; align-items: center;">
                        <img :src="header.img">
                        <h3>{{ header.title }}</h3>
                    </div>
                </div>
                <ul>
                    <li v-for="(item, issuer) in lines">
                        <img :src="getDetails(header.currency, item.issuer).avatar || 'https://user-images.githubusercontent.com/1287855/42951396-f1d82368-8b2a-11e8-9855-e20630fc1dc0.png'">
                        <div class="row">
                            <h3>{{ getDetails(header.currency, item.issuer).name || sliceAddress(item.issuer) }}</h3>
                            <h3 v-if="true" class="push number">{{ $xapp.currencyFormat(item.value, header.currency) }} {{ $xapp.currencyCodeFormat(header.currency, 4) }}</h3>
                            <!-- <div v-else class="asset-values" style="margin-left: auto">
                                <h5 class="push number">{{ activeCurrency === 'XRP' ? $xapp.currencyFormat(accountCurrencies[currency].value * 1_000_000, 'XRP') : $xapp.currencyFormat(accountCurrencies[currency].value * rate, activeCurrency) }} {{ activeCurrency }}</h5>
                                <h6 class="push number">{{ $xapp.currencyFormat(calculateAssetValue(currency), currency) }} {{ $xapp.currencyCodeFormat(currency, 4) }}</h6>
                            </div> -->
                        </div>
                    </li>
                    <!-- <li>
                        <img src="https://user-images.githubusercontent.com/1287855/42951396-f1d82368-8b2a-11e8-9855-e20630fc1dc0.png">
                        <div class="row">
                            <h3>{{ sliceAddress('rMtfWxk9ZLr5mHrRzJMnaE5x1fqN3oPdJ7') }} </h3>
                            <h3 v-if="true" class="push number">{{ $xapp.currencyFormat('999.12345678') }} {{ $xapp.currencyCodeFormat('TEST', 4) }}</h3>
                        </div>
                    </li> -->
                </ul>
                <hr>
                <h3 class="push number">Total: {{ $xapp.currencyFormat(header.balance, header.currency) }} {{ $xapp.currencyCodeFormat(header.currency, 4) }} | {{ activeCurrency === 'XRP' ? $xapp.currencyFormat(header.value * 1_000_000, 'XRP') : $xapp.currencyFormat(header.value * rate, activeCurrency) }} {{ activeCurrency }}</h3>
                <!-- <h5 class="push number">{{ activeCurrency === 'XRP' ? $xapp.currencyFormat(header.value * 1_000_000, 'XRP') : $xapp.currencyFormat(header.value * rate, activeCurrency) }} {{ activeCurrency }}</h5> -->
            </div>
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
            for(const line in this.lines) {
                const obj = {}
                if(this.lines[line].balance) {
                    array.push(obj)
                }
            }
        }
    },
    methods: {
        sliceAddress(account) {
            return `${account.slice(0, 4)}...${account.slice(-4)}`
        },
        getDetails(currency, issuer) {
            const details = this.$xapp.getAssetDetails(currency, issuer)
            return details
        }
    },
    async created() {
        this.$emitter.on('details', obj => {
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
    background-color: rgba(0,0,0,0.5);
    z-index: 99;
}
#overlay-element {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--var-bg-color);
    width: 85%;
    height: 300px;
    padding: 10px;
    border-radius: 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    font-size: 15px;
    height: 220px;
    overflow: auto;
    width: 90%;
    align-self: center;
    color: var(--var-txt-color);
}
li {
    border-bottom: 1px solid var(--var-border);
    padding: 4px 0;
    display: flex;
    flex-direction: row;
    align-items: center;
}
img {
    width: 25px;
    height: 25px;
    object-fit: cover;
    margin-right: 10px;
}
</style>