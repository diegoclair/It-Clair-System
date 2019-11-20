import Vue from "vue";
import Vuex from "vuex";

import authModule from './modules/auth/index'
import postgresqlModule from './modules/postgresql/index'

Vue.use(Vuex);

export const store = new Vuex.Store({
  modules: {
    auth: authModule,
    postgresql: postgresqlModule
  }
});
