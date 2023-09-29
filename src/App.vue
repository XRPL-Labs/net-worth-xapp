<template>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
  <div id="view" :style="$xapp.themeStyles">
    <SpinnerModal v-if="busy" />
    <Main v-if="ready" />
    <Modal />
    <div v-if="error" class="row h-100">
      <div class="column failed-start">
        <fa :icon="['fas', 'exclamation-circle']" />
        <p>{{ error }}</p>
        <a v-if="error !== this.$t('xapp.error.trustline_count')" @click="subscribe()" class="btn btn-primary">
          {{ $t('xapp.button.try_again') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import Main from '@/components/Main.vue'
import Spinner from '@/components/Spinner.vue'
import SpinnerModal from '@/components/SpinnerModal.vue'
import Modal from '@/components/Modal.vue'

export default {
  name: 'App',
  components: {
    Main,
    Spinner,
    SpinnerModal,
    Modal
  },
  data() {
    return {
      data: {},
      busy: true,
      ready: false,
      error: ''
    }
  },
  created() {
    this.$emitter.on('busy', (boolean) => {
      this.busy = boolean
    })
  },
  async mounted() {
    try {
      await this.getTokenData()
      await this.subscribe()
      this.ready = true
    } catch (e) {
      this.busy = false
    }
  },
  methods: {
    async getTrustLines() {
      let marker
      let Acclines
      for(let i = 0; i < 100; i++) {
        const account_lines = await this.$rippled.send({
          command: 'account_lines',
          account: this.$xapp.getAccount(),
          marker: marker
        })
        Acclines = Acclines ? Acclines.concat(account_lines.lines) : account_lines.lines

        if(!account_lines.hasOwnProperty('marker')) {
          console.log(account_lines)
          return Acclines
        }
        marker = account_lines.marker
      }
      throw this.$t('xapp.error.trustline_count')
    },
    async setAccountData() {
      const account_info = await this.$rippled.send({
        command: 'account_info',
        account: this.$xapp.getAccount()
      })
      if (account_info.error === 'actNotFound') return this.$xapp.setAccountData(null)


      const account_lines = await this.getTrustLines()
      console.log(account_lines)

      const account_data = {
        account: this.$xapp.getAccount(),
        account_data: account_info.account_data,
        lines: account_lines
      }
      this.$xapp.setAccountData(account_data)
    },
    async getTokenData() {
      this.busy = true
      // todo DELETE MEEE ASAP ONLY FOR TESTING ON LOCALHOST
      if (typeof window.ReactNativeWebView === 'undefined') {
        this.data = {
          account: 'rJR4MQt2egH9AmibZ8Hu5yTKVuLPv1xumm',
          nodetype: 'MAINNET'
          // account: 'rMtfWxk9ZLr5mHrRzJMnaE5x1fqN3oPdJ7',
          // nodetype: 'TESTNET'
        }
        await this.$xapp.setAccount(this.data.account)
      } else {
        try {
          this.data = await this.$xapp.getTokenData()
          this.$xapp.setAccount(this.data.account)
        } catch (e) {
          this.busy = false
          this.error = this.$t('xapp.error.get_ott_data')
          throw e
        }
      }
    },
    async subscribe() {
      // this.busy = true
      try {
        const url = this.data.nodewss
        this.$rippled.connect(url, {NoUserAgent: true, MaxConnectTryCount: 5})
        await this.setAccountData()
        this.$rippled.send({
          command: 'subscribe',
          accounts: [this.data.account]
        })

        this.$rippled.on('transaction', (tx) => {
          this.setAccountData()
          this.$xapp.onTransaction(tx)
        })
        this.busy = false
        this.ready = true
        this.error = false
      } catch (e) {
        this.busy = false
        console.log(e)
        if(e === this.$t('xapp.error.trustline_count')) {
          this.error = e
        } else this.error = this.$t('xapp.error.subscribe_to_account')
        throw e
      }
    }
  }
}
</script>

<style>
@import url('https://use.typekit.net/iqo4nny.css');
/* @import url('https://fonts.googleapis.com/css?family=Ubuntu+Mono'); */
@import url('https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap');

/* GLOBAL STYLES */
.failed-start {
  align-items: center;
}
.btn {
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
  font-family: proxima-nova, sans-serif;
  font-weight: 800;
  border-radius: 5rem;
}
.btn svg {
  margin-right: 0.2rem;
}
.btn.btn-primary {
  background: var(--var-blue);
  border-color: var(--var-blue);
  color: var(--var-white);
}
.btn.btn-secondary {
  background: var(--var-grey);
  border-color: var(--var-grey);
  color: var(--var-white);
}
.btn.btn-light {
  background: var(--var-light);
  border-color: var(--var-light);
  color: var(--var-black);
}
.mono {
  font-family: 'Ubuntu Mono' !important;
}

.push {
  margin-left: auto !important;
}
.h-100 {
  height: 100%;
}
.margin-0 {
  margin: 0 !important;
}
#app {
  font-family: proxima-nova, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}

html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
}
#view {
  height: 100vh;
  padding: 0 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  touch-action: none;
  /* border: 1px solid blue; */
}

.swal2-container.swal2-backdrop-show,
.swal2-container.swal2-noanimation {
  background: rgba(255, 255, 255, 0.4) !important;
}
.swal2-popup {
  box-shadow: 2px 2px 11px rgba(0, 0, 0, 0.3) !important;
  border-radius: 10px !important;
}
.row {
  display: flex;
  flex-direction: row;
  width: 100%;
  margin: 5px 0;
  align-items: center;
}
.column {
  display: flex;
  flex-direction: column;
  width: 100%;
}
fieldset {
  display: flex;
  align-items: center;
  margin-inline-start: 0;
  margin-inline-end: 0;
  padding-block-start: 0;
  padding-inline-start: 0;
  padding-inline-end: 0;
  padding-block-end: 0;
  min-inline-size: min-content;
  border-width: 0;
  border-style: none;
  border-color: rgba(255, 255, 255, 0);
  border-image: none;
}
</style>
