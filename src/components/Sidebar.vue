
<template id='Sidebar'>
<!-- Sidebar and toolbar(title) -->

  <div>
    <v-navigation-drawer :mini-variant.sync="mini" clipped permanent app >
      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <v-avatar size="62">
              <img 
              src="https://images.vexels.com/media/users/3/140752/isolated/preview/17e31e592ab23bb0e8b2c0e76c0a4361-avatar-de-perfil-masculino-5-by-vexels.png" 
              alt="Perfil photo">
            </v-avatar>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title class="py-1">
              <span class="fontSize">{{name}}</span>
            </v-list-item-title>
            <v-list-item-subtitle>TI</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider class="py-2"></v-divider>
        <v-list-group
          v-for="item in items"
          :key="item.title"
          v-model="item.active"
          :prepend-icon="item.action"
          no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title v-text="item.title"></v-list-item-title>
            </v-list-item-content>
          </template>

          <v-list-item
            dense
            v-for="subItem in item.items"
            :key="subItem.title"
            v-model="subItem.active"
            @click.prevent.stop="navigateTo(subItem.title)"
          >
            <v-list-item-content>
              <v-list-item-title v-text="subItem.title"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
        
        <!-- Teste outra forma de incluir sidebar
        <v-list-item @click.prevent.stop="navigateTo('Table')">
          <v-list-item-action>
            <v-icon>settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Other table</v-list-item-title>
          </v-list-item-content>
        </v-list-item>-->
      </v-list>

      <!-- PESQUISAR, NESSE MINUMIZAR QUANDO EU DIMINUIR O DISPLAY, ELE TEM QUE FECHAR SOZINHO
      @DISPLAY ALGUMA COISA, PESQUISAR ESSA FUNCAO-->
      <template v-slot:append>
        <v-list>
          <v-list-item @click.stop="minimizeSide()">
            <v-list-item-action>
              <v-icon>{{minimizeSideIcon}}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Minimizar</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>

    </v-navigation-drawer>
  </div>
</template>

<script>
import ChamadosService from '../ChamadosService';
import * as firebase from "firebase";

  export default {

    data () {
      return{
        mini: false,
        name: '',
        
        minimizeSideIcon: 'subdirectory_arrow_left',
        items: [
            {
              action: 'folder', //icone
              title: 'Chamados',
              active: true,
              items: [
                { title: 'Chamados abertos' },
                /* { title: 'Meus grupos' }, */
                { title: 'Todos chamados' },
              ],
            },
            {
              action: 'dashboard', //icone
              title: 'Dashboards',
              items: [
                { title: 'Futuro 1' },
                { title: 'Futuro 2' },
                { title: 'Futuro 3' },
              ],
            },
          ],
      }
    },
    created() {
      //quando eu deslogava e logava de novo, não colocava o nome, então criei esse created
      const name = this.$store.getters.user
      if (name !== null && name !== undefined) {
        this.getUserLogged(name.id)
      };
    },
    
    computed: {
      user () {
        return this.$store.getters.user
      },
    },
    watch: {
      user (value) {        
        if (value !== null && value !== undefined) {
          this.getUserLogged(value.id)
        }
      }
    },
    methods: {
      async getUserLogged(id){
        const dataUser = await firebase.auth().currentUser;
        if (this.name == '') {
          if (dataUser != null) {
            this.name = dataUser.displayName;
          }          
        }
      }, 

      navigateTo(where){
        if (where == 'Chamados abertos') {
          if (this.$route.fullPath !== '/') {
            //só vou para 'Chamados abertos'('/') se eu não estiver em '/', 
            //isso evita erro no console do navegador
            this.$router.push({name: 'OpenTickets'})
          }
        }else{
          if (where == 'Todos chamados') {
            if (this.$route.fullPath !== '/allTickets') {
            //só vou para 'Todos chamados'('/allTickets') se não estiver na pag '/allTickets', 
            //isso evita erro no console do navegador
            this.$router.push({name: 'AllTickets'})
          }
          } 
        }
      },

      minimizeSide(){
        if (this.minimizeSideIcon === 'subdirectory_arrow_left') {
          this.minimizeSideIcon = 'arrow_right_alt';
        } else{
          this.minimizeSideIcon = 'subdirectory_arrow_left';
        }
        this.mini = !this.mini
      },
      
    },
  }
</script>

