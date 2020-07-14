import Vue from 'vue'
import App from './App.vue'
import { Inkline } from '@inkline/inkline/src';
import { IAlert, IButton, IColumn, IContainer, IHeader, IIcon, IListGroup, IListGroupItem, ILoader, IPopover, IRow, ITooltip } from '@inkline/inkline/src/components';
import VueClipboard from 'vue-clipboard2'
import VueToast from 'vue-toast-notification'
import moment from 'moment'
import '@inkline/inkline/src/inkline.scss';
import 'vue-toast-notification/dist/theme-default.css'
import './assets/app.css'

Vue.use(VueClipboard)
Vue.use(VueToast)
Vue.use(Inkline, {
  components: { IAlert, IButton, IColumn, IContainer, IHeader, IIcon, IListGroup, IListGroupItem, ILoader, IPopover, IRow, ITooltip },
  config: { variant: 'dark' }
})

Vue.filter('fromNow', date => {
  return moment(date).subtract(5, 'hours').fromNow() // Adjust for my timezone
})
Vue.filter('trim', text => {
  return text.replace(/ /g, '')
})

new Vue({
  render: h => h(App)
}).$mount('#app')
