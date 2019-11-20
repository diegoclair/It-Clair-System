<template>
  <v-container>
    <v-layout row v-if="error">
      <v-flex xs12 sm6 offset-sm3>
        <app-alert @dismissed="onDismissed" :text="error.message"></app-alert>
      </v-flex>
    </v-layout>
    <v-layout row>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-text>
            <v-container>
              <form @submit.prevent="onSignin">
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="email"
                      label="E-mail"
                      id="email"
                      autocomplete="email"
                      v-model="email"
                      type="email"
                      required></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="password"
                      label="Senha"
                      id="password"
                      autocomplete="current-password"
                      v-model="password"
                      type="password"
                      required></v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-btn type="submit" :loading="loading">
                      Entrar
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
import * as firebase from "firebase";
  export default {
    data () {
      return {
        email: '',
        password: ''
      }
    },
    computed: {
      user () {
        return this.$store.getters.user
      },
      error () {
        return this.$store.getters.error
      },
      loading () {
        return this.$store.getters.loading
      }
    },
    watch: {
      user (value) {        
        if (value !== null && value !== undefined) {
          this.$router.push('/')
        }
      }
    },
    methods: {
      async onSignin () {
        
        await firebase.auth().signInWithEmailAndPassword(this.email, this.password)
        .then(
          res => {
            var user = firebase.auth().currentUser
            var emailVerified;

            if (user != null) {
              emailVerified = user.emailVerified;
              if (emailVerified) {
                //se tiver verificado eu logo
                this.$store.dispatch('signUserIn', {email: this.email, password: this.password})
              }else{
                this.notification('Verifique seu E-mail antes de logar!','warn','VERIFIQUE SEU E-MAIL');
                this.$store.dispatch('cleanFields')
                this.$store.dispatch('clearError')
                this.$store.dispatch('logout');
              }
            }
          }
        )
        .catch(
          error => {
            var errorCode = error.code;
            var errorMessage = error.message;

            if (errorCode == 'auth/user-not-found') {
              errorMessage = 'Esse usuário não existe. Cadastre-se!!'
              this.notification(errorMessage,'error','USUÁRIO INEXISTENTE');
              this.$router.push('/register');
            } else{
              this.notification(errorMessage,'error','Erro 052 - Falha ao autenticar login');
            };
          }
        );
      },
      onDismissed () {
        this.$store.dispatch('clearError')
      },
      notification(mensagem,msg_type,title){
        /*ESSA FUNCÃO TB TEM EM OUTROS LUGARES, ALTERAR EM TODOS
          MeusChamados.vue
          MeusGrupos.vue
          Register.vue
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
