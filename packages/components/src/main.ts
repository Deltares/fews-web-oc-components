import Vue from 'vue'
import { DateTimeSlider } from '.'
import App from './App.vue'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

Vue.component('date-time-silder', DateTimeSlider)

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
