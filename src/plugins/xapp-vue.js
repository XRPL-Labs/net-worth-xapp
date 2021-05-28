import axios from 'redaxios'
import { reactive } from 'vue'

const state = reactive({
    tokenData: {},
    jwt: null,
    account_obj: {},
    account: null,
    curatedAssets: {}
})

export default {
    install: (app, options) => {
        const urlParams = new URLSearchParams(window.location.search)
        const ott = urlParams.get('xAppToken')
        const theme = urlParams.get('xAppStyle') || 'LIGHT'

        const themeStyles = {
            '--var-white': '#FFFFFF',
            '--var-black': '#000000',
            '--var-blue': '#3052FF',
            '--var-lightblue': '#F3F5FF',
            '--var-orange': '#F8BF4C',
            '--var-lightorange': '#FFFBF4',
            '--var-green': '#3BDC96',
            '--var-lightgreen': '#F3FDF9',
            '--var-red': '#FF5B5B',
            '--var-lightred': '#FFF5F5',

            '--var-grey': '#606885',
            '--var-silver': '#ACB1C1',
            '--var-light': '#F8FAFD',

            '--var-txt-light': '#FFF',
            '--var-txt-dark': '#000',

            '--var-LIGHT': '#FFFFFF',
            '--var-LIGHT-TINT': '#F8FAFD',
            '--var-DARK': '#000000',
            '--var-DARK-TINT': '#181A21',
            '--var-MOONLIGHT': '#181A21',
            '--var-MOONLIGHT-TINT': '#262934',
            '--var-ROYAL': '#030B36',
            '--var-ROYAL-TINT': '#1A2148',

            '--var-bg-color': `var(--var-${theme})`,
            '--var-tint-color': `var(--var-${theme}-TINT)`,
            '--var-txt-color': theme === 'LIGHT' ? 'var(--var-txt-dark)' : 'var(--var-txt-light)',
            '--var-primary': theme === 'LIGHT' ? 'var(--var-blue)' : 'var(--var-orange)',
            '--var-secondary': theme === 'LIGHT' ? 'var(--var-silver)' : 'var(--var-black)',

            '--var-border': theme === 'LIGHT' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.26)',
            '--var-darker': theme === 'LIGHT' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.07)',
            '--var-overlay': theme === 'LIGHT' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)',

            'background-color': 'var(--var-bg-color)',
            'color': 'var(--var-txt-color)'
        }

        const accessToken = () => {
            if(state.jwt) return state.jwt
            else {
                state.jwt = state.tokenData.token
                return state.jwt
            }
        }

        const api = options.api
        const api_key = options.key
        const headers = (getJWT) => {
            if(getJWT) return { headers: { 'x-api-key': api_key } }
            else return { headers: { Authorization: accessToken(), 'x-api-key': api_key } }
        }

        const getTokenData = async () => {
            if(Object.keys(state.tokenData).length === 0 && state.tokenData.constructor === Object) {
                try {
                    const res = await axios.get(`${api}/xapp/ott/${ott}`, headers(true))
                    state.tokenData = res.data
                    state.jwt = res.data.token
                    return state.tokenData
                } catch(e) {
                    console.log(e)
                    throw e
                }
            } else {
                return state.tokenData
            }
        }

        const sendCommandtoXumm = (command) => {
            if (typeof window.ReactNativeWebView === 'undefined') throw new Error('This is not a react native webview')
            window.ReactNativeWebView.postMessage(JSON.stringify(command))
        }

        const openSignRequest = (uuid) => {
            try {
                sendCommandtoXumm({
                    command: 'openSignRequest',
                    uuid: uuid
                })
            } catch(e) {
                throw e
            }
        }

        const closeXapp = () => {
            try {
                sendCommandtoXumm({
                    command: "close",
                    refreshEvents: false
                })
            } catch(e) {
                throw e
            }
        }

        const getCuratedAssets = async () => {
            if(state.curatedAssets && Object.keys(state.curatedAssets).length > 0 && state.curatedAssets.constructor === Object) return state.curatedAssets
            try {
                const res = await axios.get(`${api}/curated-assets`, headers())
                state.curatedAssets = res.data
                return state.curatedAssets
            } catch(e) {
                throw e
            }
        }

        const getIssuerName = async (issuer) => {
            const curatedAssets = await getCuratedAssets()
            if(issuer === null) return null
            for(const exchange in curatedAssets.details) {
                if(!curatedAssets.details[exchange].shortlist) continue
                for(const currency in curatedAssets.details[exchange].currencies) {
                    if (curatedAssets.details[exchange].currencies[currency].issuer === issuer) return curatedAssets.details[exchange].name
                }
            }
            return 'Unknown'
        }

        const getAssetDetails = (currency, issuer) => {
            const curatedAssets = state.curatedAssets
            if(issuer === null) return null
            for(const exchange in curatedAssets.details) {
                if(!curatedAssets.details[exchange].shortlist) continue
                if(curatedAssets.details[exchange].currencies[currency]) {
                    if(curatedAssets.details[exchange].currencies[currency].issuer === issuer) return curatedAssets.details[exchange]
                }

                // for(const currency in curatedAssets.details[exchange].currencies) {
                //     if (curatedAssets.details[exchange].currencies[currency].issuer === issuer) return curatedAssets.details[exchange].name
                // }
            }
            return 'Unknown'
        }

        const status = (url) => {
            return new Promise((resolve, reject) => {
                function message(event) {
                    window.removeEventListener("message", message)
                    document.removeEventListener("message", message)

                    const data = JSON.parse(event.data)
                    if(data.method !== 'payloadResolved') return reject('')
                    if(data.reason === 'SIGNED') return resolve()
                    else return reject('')
                }
                //iOS
                window.addEventListener('message', message)
                //Android
                document.addEventListener('message', message)
            })
        }

        const payload = async (payload) => {
            try {
                const res = await axios.post(`${api}/payload`, payload, headers())
                openSignRequest(res.data.uuid)
                await status()
                const result = await axios.get(`${api}/payload/${res.data.uuid}`, headers())
                return result
            } catch(e) {
                if (e === '') throw { msg: 'closed', error: false }
                throw e
            }
        }

        const getAccount = () => {
            return state.account
        }

        const getAccountData = () => {
            return state.account_obj
        }

        const setAccount = (account) => {
            state.account = account
        }

        const setAccountData = (data) => {
            state.account_obj = data
        }
        const getAccountFunds = (currency, issuer) => {
            if(state.account_obj === null || typeof state.account_obj === undefined) return null
            if(currency === 'XRP') {
                if(state.account_obj.objects === null || typeof state.account_obj.objects === undefined) return null
                if(typeof state.account_obj.account_data === undefined || typeof state.account_obj.account_data.Balance === undefined) return null
                const accountReserve = 20000000
                const reserved = state.account_obj.objects.length * 5000000
                const balance = (state.account_obj.account_data.Balance - accountReserve - reserved)
                return balance
            } else {
                if(!Array.isArray(state.account_obj.lines)) return 0
                if(state.account_obj.lines.length < 1) return 0
                for(const line of state.account_obj.lines) {
                    if(line.account === issuer && line.currency === currency) {
                        const balance = parseFloat(line.balance)
                        return balance
                    }
                }
            }
        }

        const onTransaction = (tx) => {
            console.log(tx)
        }

        const currencyFormat = (amount, currency) => {
            amount = Number(amount)
            if(amount === null || Number.isNaN(amount)) amount = 0 // Set amount to 0 when there is no trustline

            var integer = Math.trunc(amount)
            var decimal = amount % 1

            switch(currency) {
                case 'XRP':
                    return amount = Number(amount / 1_000_000).toFixed(6)
                case 'EUR':
                case 'USD':
                    decimal = decimal.toFixed(2)
                    return (Number(integer) + Number(decimal)).toFixed(2)
                default:
                    decimal = decimal.toFixed(8)
                    return (Number(integer) + Number(decimal)).toFixed(8)
            }
        }

        function isHex(string) {
            var re = /[0-9A-Fa-f]{6}/g
            const isValid = re.test(string) && !isNaN( parseInt(string,16) )
            re.lastIndex = 0
            return isValid
        }

        const currencyCodeFormat = (string, maxLength) => {
            if (typeof maxLength === 'undefined') maxLength = 4
            if(!isHex(string)) {
                if(string.length > maxLength) {
                    return string.slice(0, maxLength)
                } else return string
            }

            var hex = string.toString()
            var str = ''

            // check for XLS15d
            if (hex.startsWith('02')) {
                try {
                    const binary = Buffer.from(hex, 'hex')
                    str = binary.slice(8).toString('utf-8');
                } catch {
                    for (var n = 0; n < hex.length; n += 2) {
                        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
                    }
                }
            } else {
                for (var n = 0; n < hex.length; n += 2) {
                    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
                }
            }

            var trimmed = str.trim()
            if(trimmed.length > maxLength) {
                return trimmed.slice(0, maxLength)
            } else return trimmed
        }

        app.config.globalProperties.$xapp = {
            ott: ott,
            accessToken,
            theme: theme,
            themeStyles: themeStyles,
            endpoint: api,
            getTokenData,
            getCuratedAssets,
            getIssuerName,
            getAssetDetails,
            openSignRequest,
            closeXapp,
            status,
            setAccountData,
            setAccount,
            getAccount,
            getAccountData,
            getAccountFunds,
            onTransaction,
            signPayload: payload,
            currencyFormat,
            currencyCodeFormat
        }
    }
}