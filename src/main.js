import { createApp } from 'vue'
import App from './App.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowLeft, faArrowRight, faArrowDown, faSignInAlt, faTimesCircle, faExclamationCircle, faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

library.add(faArrowLeft, faArrowRight, faArrowUp, faArrowDown, faSignInAlt, faTimesCircle, faExclamationCircle)

const app = createApp(App)

import { createI18n } from 'vue-i18n'

import { languages, defaultLocale } from './locale/index.js'
const messages = Object.assign(languages)

const i18n = createI18n({
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages
})

import mitt from 'mitt'
const emitter = mitt()
app.config.globalProperties.$emitter = emitter

app.use(VueSweetalert2)
app.use(i18n)
app.component('fa', FontAwesomeIcon)

import rippled from './plugins/rippled-vue'
import xapp from './plugins/xapp-vue'
app.use(rippled)
app.use(xapp, { api: process.env.VUE_APP_API_ENDPOINT, key: process.env.VUE_APP_XAPP_KEY })

app.mount('#app')
