import Vue from "vue";
import * as firebase from "firebase";
import Notifications from 'vue-notification';
import AsyncComputed from 'vue-async-computed';
import vuetify from '@/plugins/vuetify'; // path to vuetify export
import { store } from './components/store/index';
import router from "./router";
//import App from "./App.vue";
//import AlertCmp from './components/Shared/Alert.vue';

const App = () => import('@/App.vue');
const AlertCmp = () => import('@/components/Shared/Alert.vue');
const Table = () => import('@/components/Chamados/Table.vue');

Vue.component('app-alert', AlertCmp);
Vue.component('app-table', Table);

Vue.use(AsyncComputed);
Vue.use(Notifications);

Vue.config.productionTip = false;

const firebaseConfig = {
  apiKey: "AIzaSyBe4lB_kturDzaGhou3ksDX8XXo8YNx9CE",
  authDomain: "itclair-chamados.firebaseapp.com",
  databaseURL: "https://itclair-chamados.firebaseio.com",
  projectId: "itclair-chamados",
  storageBucket: "itclair-chamados.appspot.com",
  messagingSenderId: "714985789635",
  appId: "1:714985789635:web:ddc7bf7c0ad1385d6aea76"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

new Vue({
  router,
  vuetify,
  store,
  render: h => h(App),  
  async created() {
    function getCurrentUser() {
      return new Promise((resolve, reject) => {
         const unsubscribe = firebase.auth().onAuthStateChanged(user => {
           //router.history.current.path !== '/login'
           if (user !== null  && user !== undefined) {
             
           }else{
             if (router.history.current.path !== '/login' && router.history.current.path !== '/register') {
               router.push('/login');
             };
           } 
           resolve(user);
         }, reject);
      });
    };
    const res = await getCurrentUser(); 
    if (res !== null && res !== undefined) {
      this.$store.dispatch('autoSignIn', res);
    };
    
  },
}).$mount("#app");
