<template>
    <div>
        <div class="container">
            <div class="row header" style="margin-bottom: 0;">
                <h6 class="number">
                    <span class="dot" :style="{ 'background-color': online ? 'green' : 'red' }"></span>
                    {{ account }}
                </h6>
                <h3 @click="signin()" style="margin-left: auto;" >
                    <fa :icon="['fas', 'sign-in-alt']"/>
                </h3>
            </div>
            <hr>
            <div v-if="$xapp.getAccountData() === null" class="column h-100">
                <div id="failed-start" class="column">
                    <fa :icon="['fas', 'exclamation-circle']" />
                    <p>{{ $t('ledger.request_data_response_ws.actNotFound') }}</p>
                    <a @click="signin()" class="btn btn-primary">{{ $t("xapp.button.account_not_found_login_button") }}</a>
                </div>
            </div>
            <div v-else id="scroll-container" class="column">
                <Assets />
            </div>
        </div>
    </div>
</template>

<script>
import Assets from '@/components/Assets.vue'
import Spinner from './Spinner.vue'

export default {
    name: 'main',
    components: { Assets, Spinner },
    data() {
        return {
            online: false
        }
    },
    computed: {
        account() {
            return this.$xapp.getAccount()
        }
    },
    methods: {
        async signin() {
            this.$emitter.emit('busy', true)
            try {
                const result = await this.$xapp.signPayload({
                    user_token: this.$xapp.ott,
                    txjson: {
                        TransactionType: "SignIn"
                    }
                })
                const account = result.data.response.account
                if(this.$xapp.getAccount() === account) throw { msg: 'Same account', error: false }
                await this.$rippled.send({
                    command: 'unsubscribe',
                    accounts: [this.$xapp.getAccount()]
                })
                await this.setAccountData(account)
                await this.$rippled.send({
                    command: 'subscribe',
                    accounts: [account]
                })
                this.$emitter.emit('accountChange')
            } catch(e) {
                if(e.error !== false) {
                    this.$emitter.emit('modal', {
                        type: 'error',
                        title: this.$t('xapp.error.modal_title'),
                        text: this.$t('xapp.error.signin'),
                        buttonText: this.$t('xapp.button.close')
                    })
                }
            }
            this.$emitter.emit('busy', false)
        },
        async setAccountData(account) {
            const account_info = await this.$rippled.send({
                command: 'account_info',
                account: account
            })
            if(account_info.error === 'actNotFound') {
                this.$xapp.setAccountData(null)
                return this.$xapp.setAccount(account)
            }
            this.$xapp.setAccount(account)

            const account_lines = await this.$rippled.send({
                command: 'account_lines',
                account: account
            })
            const account_objects = await this.$rippled.send({
                command: 'account_objects',
                account: account
            })

            const account_data = {
                account: this.$xapp.getAccount(),
                account_data: account_info.account_data,
                objects: account_objects.account_objects,
                lines: account_lines.lines
            }
            this.$xapp.setAccountData(account_data)
        }
    },
    async mounted() {
        setInterval(() => {
            this.online = this.$rippled.getState().online
        }, 1000)
    }
}
</script>

<style>
#scroll-container {
    height: 100vh;
    overflow: auto;
}
#scroll-container::-webkit-scrollbar {
  display: none;
}

.payment-card {
    border: solid 1px black;
    width: 90%;
    height: 100%;
    margin: 10px 0;
    text-align: center;
}
span.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: white;
    display: inline-block;
}
h2 {
    text-align: center;
}
h3 {
    margin: 0;
    font-size: 16px;
}
h6 {
    margin: 0;
}
.align-end {
    text-align: end;
}
hr {
    /* display: block;
    unicode-bidi: isolate;
    margin-block-start: 0.5em;
    margin-block-end: 0.5em;
    margin-inline-start: auto;
    margin-inline-end: auto;
    overflow: hidden;
    border-style: solid;
    border-width: 1px; */
    margin: 0;
    border: 0;
    border-top: 1px solid var(--var-border);
    width: 100%;
}
hr.divide {
    border: 1px solid black;
    width: 110%;
}
.container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    align-items: center;
}
.btn.btn-secondary {
    background-color: var(--var-secondary) !important;
    color: grey !important;
}
.btn.btn-success {
    background-color: var(--var-green);
    /* background-color: green; */
}
.btn.btn-cancel {
    background-color: var(--var-red);
    /* background-color: red; */
}
.btn.btn-warning {
    background-color: var(--var-orange);
}
.btn.label {
    padding: 5px !important;
    border-radius: 15px !important;
}
.header {
    margin: 10px;
    text-align: center;
    color: var(--var-primary);
}
.input-error {
    border-color: red !important;
}
.input-label {
    width: 100%;
    text-align: center;
    padding: 10px 5px;
    font-size: 14px;
    border-radius: 10px;
    border: 1px solid var(--var-border);
    position: relative;
}
.input-label:focus-within {
    border: 1px solid var(--var-primary);
}
.input-label label {
    position: absolute;
    top: 0;
    right: 8px;
    bottom: 0;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    /* background-color: var(--var-bg-color); */
}
.input-label input {
    color: var(--var-txt-color);
    background-color: var(--var-bg-color);
    border: 0;
    text-align-last: center;
    font-family: 'Ubuntu Mono' !important;
    width: calc(100% - 8px);
}
.input-label input:focus {
    outline: 0;
}
select {
    -webkit-appearance: none;
}
/* input[inputmode=decimal] */
select {
    width: 100%;
    color: var(--var-txt-color);
    background-color: var(--var-bg-color);
}
/* input[inputmode=decimal] */
select {
    text-align: center;
    text-align-last: center;
    padding: 10px 5px;
    font-size: 14px;
    border-radius: 10px;
    border: 1px solid var(--var-border);
}
select.arrow {
    background-image:
        linear-gradient(45deg, transparent 50%, gray 50%),
        linear-gradient(135deg, gray 50%, transparent 50%);
    background-position:
        calc(100% - 20px) calc(1em + 2px),
        calc(100% - 15px) calc(1em + 2px);
    background-size:
        5px 5px,
        5px 5px;
    background-repeat: no-repeat;
}
select:focus {
    border: 1px solid var(--var-primary);
}
select.arrow:focus {
  background-image:
    linear-gradient(45deg, gray 50%, transparent 50%),
    linear-gradient(135deg, transparent 50%, gray 50%);
  background-position:
    calc(100% - 15px) 1em,
    calc(100% - 20px) 1em;
  background-size:
    5px 5px,
    5px 5px;
  background-repeat: no-repeat;
  outline: 0;
}
</style>
