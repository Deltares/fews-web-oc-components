import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { mdi } from 'vuetify/iconsets/mdi'
import { RouterView } from 'vue-router'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import router from './router'

const vuetify = createVuetify({ icons: { defaultSet: 'mdi', sets: { mdi } } })
const app = createApp({ render: () => h(RouterView) })

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
