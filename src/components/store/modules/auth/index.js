import * as firebase from "firebase";

export default({
    state: {
        user: null,
        loading: false,
        error: null,
      },
      mutations: {
        setUser (state, newUserData) {
          state.user = newUserData;
        },
        setLoading(state, loading){
          state.loading = loading;
        },
        setError(state, error){
          state.error = error;
        },
        clearError(state){
          state.error = null;
        },
      },
      actions: {
        commitUser({commit}, idUser){
          const newUser = {
            id: idUser
          } 
          commit('setUser', newUser);
        },
        async signUserUp({commit}, newUserData) {
          commit('clearError');
          commit('setLoading', true);
          //to create a new user at firebase
          const res = await firebase.auth().createUserWithEmailAndPassword(newUserData.email, newUserData.password)
          .then(
            res => {
              //se não deu erro
               const newUser = {
                id: res.user.uid
              } 

              commit('setUser', newUser);

              var user = firebase.auth().currentUser;
              user.updateProfile({
                displayName: newUserData.name,
              }).then(function() {
                console.log('Update successful'); 

                user.sendEmailVerification().then(function() {
                  console.log('Email sent.');
                  
                }).catch(function(error) {
                  console.log('Erro 047 - ' + error);
                });
              }).catch(function(error) {
                console.log('Erro 046 - ' + error);
              });
              commit('setLoading', false);
            }
          )
          .catch(
            err => {
              commit('setLoading', false);
              commit('setError', err);
              console.log('Erro 059 - ' + err);
            }
          )
        },
        async signUserIn({commit}, userData){
          commit('setLoading', true);
          commit('clearError');
          firebase.auth().signInWithEmailAndPassword(userData.email, userData.password)
          .then(
            res => {
              const signInUser = {
                id: res.user.uid
              }          
              commit('setUser', signInUser)
              commit('setLoading', false);
            }
          )
          .catch(
            err => {
              commit('setError', err);
              commit('setLoading', false);
              console.log(err);
            }
          )
        },
        autoSignIn({commit}, data){ 
          commit('setUser', {id: data.uid})
        },
        logout({commit}){
          firebase.auth().signOut();
          commit('setUser', null);
        },
        clearError({commit}){
          commit('clearError');
        },
      },
      getters: {
        user (state) {
          return state.user;
        },
        loading (state){
          return state.loading;
        },
        error (state){
          return state.error;
        },
      },
});