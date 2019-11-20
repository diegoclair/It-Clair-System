<!--
  TODO:
  criar a confirmação do e-mail
  
  criar o esqueci minha senha

-->

<template >
  <div id="app" >
    <notifications group="notification" />
    <v-app >
      <v-app-bar app clipped-left dense>
        <router-link class="title" to="/" tag="span" style="cursor: pointer">IT Clair</router-link>
        <v-spacer></v-spacer>
        <v-toolbar-items
         >
          <v-btn text
            v-for="item in menuItems"
            :key="item.title"
            :to="item.link">
            <v-icon size="18" left>{{item.icon}}</v-icon>{{item.title}}
          </v-btn>
          <v-btn text v-if="userIsAuthenticated" @click.prevent.stop="onLogout">
            <v-icon size="18" left>input</v-icon>Sair
          </v-btn>
        </v-toolbar-items>
      </v-app-bar>

      <!-- Sidebar -->
        <Sidebar v-if="currentLink()"/>
      <!-- Sidebar -->

      <v-content app>
        <v-container class="mp">
          <v-layout> 
            <v-flex>
              <router-view></router-view>
            </v-flex>
          </v-layout>
        </v-container>
     </v-content>

    </v-app>
    
  </div>
  
</template>

<script>

import Sidebar from '../src/components/Sidebar';

export default {
  
  components: {
    Sidebar,
  },

  data () {
    return{};
  },
  computed: {
    menuItems (){
      let menuItems = [
        { icon: 'face', title: 'Criar conta', link: '/register'},
        { icon: 'lock_open', title: 'Entrar', link: '/login'},
      ];

      if (this.userIsAuthenticated) {
        //se o usuario estiver logado eu retorno esse menu de opções, se não, eu retorno o de cima
        menuItems = [
          { icon: 'person', title: 'Profile', link: '/profile'},
        ];
      };
      return menuItems;
    },
    userIsAuthenticated(){

      return this.$store.getters.user !== null && this.$store.getters.user !== undefined;
    },
  },
  methods:{
    currentLink(){
      if (window.location.pathname == '/login' || window.location.pathname == '/register') {
        return false
      }else{
        return true;
      }
    },
    onLogout(){
      localStorage.removeItem(`chamados-${this.$store.getters.user.id}`);
      this.$store.dispatch('cleanFields')
      this.$store.dispatch('clearError')
      this.$store.dispatch('logout');
    },
  },
}
</script>

<style lang="stylus">
  @import './stylus/main'
</style>

<style scoped>

.mp {
  /* margin e paddind, dessa forma consegui alinhar a tabela a esquerda*/
  padding: 0px;
  margin: 0px;
}
#app{
  height: 100%;
  position: flex;
}

</style>
