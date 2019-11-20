<template>
  <v-container>
    <v-layout row v-if="error || createDBError !== false">
      <v-flex xs12 sm6 offset-sm3>
        <app-alert @dismissed="onDismissed" :text="error.message"></app-alert>
      </v-flex>
    </v-layout>
    <v-layout row>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-text>
            <v-container>
              <form @submit.prevent="onSignup">
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="email"
                      label="E-mail"
                      id="email"
                      placeholder="name@example.com"
                      autocomplete="email"
                      v-model="email"
                      type="email"
                      required
                      ></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="networkLogin"
                      label="Login de rede Fesp"
                      placeholder="exemple.teste"
                      id="networkLogin"
                      v-model="loginNetwork"
                      type="text"
                      required
                      ></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="name"
                      label="Nome Exebição"
                      placeholder="Example T. Examps"
                      id="name"
                      v-model="name"
                      type="text"
                      required
                      ></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="password"
                      label="Senha"
                      id="password"
                      autocomplete="new-password"
                      v-model="password"
                      type="password"
                      required></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="confirmPassword"
                      label="Confirmar senha"
                      id="confirmPassword"
                      autocomplete="new-password"
                      v-model="confirmPassword"
                      type="password"
                      required
                      :rules="[comparePasswords]"></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-btn 
                      :disabled="comparePasswords !== '' ? true : false" 
                      type="submit" :loading="loading">
                      Cadastrar
                       <span slot="loader" class="custom-loader">
                        <v-icon light>cached</v-icon>
                       </span>
                    </v-btn>
                  </v-flex>
                </v-layout>
              </form>
            </v-container>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import ChamadosService from '../../ChamadosService'
import { log } from 'util'

  export default {
    data () {
      return {
        email: '',
        name: '',
        loginNetwork: '',
        password: '',
        confirmPassword: '',
        loading: false,
        createDBError: false,
      }
    },
    computed: {
      comparePasswords () {
        return this.password !== this.confirmPassword ? 'Senhas são diferentes' : ''
      },
      error () {
        return this.$store.getters.error
      },
    },

    methods: {
      
      async onSignup () {
        this.loading = true;
        const res = await this.$store.dispatch('signUserUp', {email: this.email, password: this.password, name: this.name});
        const id_firebase = this.$store.getters.user;    

        if(id_firebase !== null && id_firebase !== undefined && id_firebase !== ''){
          const resCreateNewFirebaseUser = await ChamadosService.createFirebaseUser(id_firebase.id, this.loginNetwork);
          
          this.email = '';
          this.name = '';
          this.loginNetwork = '';
          this.password = '';
          this.confirmPassword = '';

          //depois de criar o usuario no firebase, ele fica logado, então vou deslogar ele aqui,
          //pois na criação, ele só pçode logar após verificar o e-mail
          this.$store.dispatch('logout');
        
          this.loading = false;
          
          if (resCreateNewFirebaseUser == true || resCreateNewFirebaseUser == 'true') {
            this.notification('Verifique seu E-mail antes de logar!','warn','Login criado com sucesso!');
            this.$router.push('/login');
          }else{
            this.createDBError = resCreateNewFirebaseUser;
          };
        };
          
        this.loading = false;
      },
      
      onDismissed () {
        this.$store.dispatch('clearError');
      },

      notification(mensagem,msg_type,title){
        /*ESSA FUNCÃO TB TEM EM OUTROS LUGARES, ALTERAR EM TODOS
          MeusChamados.vue
          MeusGrupos.vue
          Login.vue
        */

        //para erro e alerta, não precisa mandar o msg_type
        let notify_type = '';
        let title_type = '';
        
        if (msg_type == 'success') {
          notify_type = 'success';
          title_type = (title == '' || title == null || title == undefined) ? 'SUCESSO' : title;
        }else if (mensagem.indexOf('Alerta ') == 0 || msg_type == 'warn') {
          //eu crio algumas msgs de alerta, por isso pesquiso por elas aqui
          notify_type = 'warn';
          title_type = (title == '' || title == null || title == undefined) ? 'ATENÇÃO' : title;
        }else {
          //se não for alerta nem success, coloco como erro
          notify_type = 'error';
          title_type = (title == '' || title == null || title == undefined) ? 'ERRO' : title;
        }
        //to read about notify  (https://www.npmjs.com/package/vue-notification)
        this.$notify({
          group: 'notification',
          title: `${title_type}!!!`,
          text: mensagem,
          type: notify_type,
        });
      },
    }
  }
</script>