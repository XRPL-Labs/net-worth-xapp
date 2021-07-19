<template>
  <!-- <div class="switch">
    <h3>{{ $t('xapp.headers.portfolio_balance') }}</h3>
    <button @click="signin()" class="btn btn-light"><fa :icon="['fas', 'random']" /> Switch account</button>
  </div> -->
  <div v-if="!accountIsActive" class="row h-100">
    <div class="column failed-start">
      <fa :icon="['fas', 'exclamation-circle']" />
      <p>{{ $t('ledger.request_data_response_ws.actNotFound') }}</p>
      <a @click="signin()" class="btn btn-primary">{{ $t('xapp.button.account_not_found_login_button') }}</a>
    </div>
  </div>
  <div v-else id="scroll-container">
    <Assets />
  </div>
</template>

<script>
import Assets from '@/components/Assets.vue'
import Spinner from './Spinner.vue'

export default {
  name: 'main',
  components: {Assets, Spinner},
  data() {
    return {
      online: false
    }
  },
  computed: {
    account() {
      return this.$xapp.getAccount()
    },
    accountIsActive() {
      if(this.$xapp.getAccountData() === null) return false
      else return true
    }
  },
  methods: {
    async signin() {
      this.$emitter.emit('busy', true)
      try {
        const result = await this.$xapp.signPayload({
          user_token: this.$xapp.ott,
          txjson: {
            TransactionType: 'SignIn'
          }
        })
        const account = result.data.response.account
        if (this.$xapp.getAccount() === account) throw {msg: 'Same account', error: false}
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
      } catch (e) {
        if (e.error !== false) {
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
      if (account_info.error === 'actNotFound') {
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
  mounted() {
    setInterval(() => {
      this.online = this.$rippled.getState().online
    }, 1000)
    this.$emitter.on('account-change', () => {
        this.signin()
      })
  }
}
</script>

<style>
.switch {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}
.switch h3 {
  margin-left: 0.5rem;
}
#scroll-container {
  flex-grow: 1;
  overflow-x: hidden;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
}
#scroll-container::-webkit-scrollbar {
  display: none;
}
</style>
