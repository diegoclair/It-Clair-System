import ChamadosService from "../../../../ChamadosService";
import * as firebase from "firebase";

export default {
  state: {
    openChamados: '',
    allChamados: '',
    gmuds: '',
    tickets: '',
    userLoggedId: '',
    fornecedorData: '',
  },
  mutations: {
    setOpenChamados(state, data){
      state.openChamados = data;
    },
    setAllChamados(state, data){
      state.allChamados = data;
    },
    setGmuds(state, data){
      state.gmuds = data;
    },
    setTickets(state, data){
      state.tickets = data;
    },
    setUserLoggedId(state, id){
      state.userLoggedId = id;
    },
    setFornecedor(state, data){
      state.fornecedorData = data;
    },
    setCleanFields(state){
      state.openChamados = '';
      state.allChamados = '';
      state.gmuds = '';
      state.tickets = '';
      state.userLogged = '';
    },
  },
  actions: {
    cleanFields ({commit}){      
      commit('setCleanFields');
    },
    async getDataFromServer({commit}, data){ 
      
      //get user logged
      await function getCurrentUser() {
        return new Promise((resolve, reject) => {
          const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            user !== null && user !== undefined ? commit('setUserLoggedId', user.uid) : null;
            resolve(user);
          }, reject);
        });
      }();
      
      if (this.getters.userLoggedId !== null && this.getters.userLoggedId !== undefined && this.getters.userLoggedId !== '') {
        
        if(this.getters.openChamados == '' || data.table == 'chamado'){ //check because the func getDataFromServer is called two times
          const id_firebase = this.getters.userLoggedId;
          const sendData = {  
            table: 'chamado', //aqui nao pode ser data.table, pois posso chamar com ele em branco pra preencher todas tabelas
            closed: data.closed, // tras tb chamados fechados
            whereTable: 'firebaseuser',
            whereField: 'id_firebase',
            whereValue:  id_firebase,
            sync: data.sync,
          };
          
          await ChamadosService.getData(sendData, data.clearStorage !== null
                                               && data.clearStorage !== undefined ? 
                                               data.clearStorage : 
                                               null)
            .then(
              res => {  
                let allChamados = [], openChamados = [];
                
                for (let i = 0; i < res.length; i++) {
                  if (res[i].status.trim() !== 'Fechado' 
                   && res[i].status.trim() !== 'Fechado pelo solicitante'
                   && res[i].status.trim() !== 'Removido'
                   && res[i].status.trim() !== 'Cancelado') {
                    openChamados.push(res[i]);
                  }else{
                    allChamados.push(res[i])
                  };
                };
                commit('setOpenChamados', openChamados); 
                commit('setAllChamados', allChamados);      
              }
            ).catch(
              err => {
                commit('setLoading', false);
                commit('setError', err);
                console.log(err);
              }
            );
        };
  
        if(this.getters.gmuds == '' || data.table == 'gmud'){
          const sendData = {  
            table: 'gmud', //aqui nao pode ser data.table, pois posso chamar com ele em branco pra preencher todas tabelas
            closed: data.closed, whereTable: '', whereField: '', whereValue:  '', sync: false,
          };
          await ChamadosService.getData(sendData)
          .then(
            res => {
              commit('setGmuds', res);        
            }
          ).catch(
            err => {
              commit('setLoading', false);
              commit('setError', err);
              console.log(err);
            }
          );
        };
  
        if(this.getters.tickets == '' || data.table == 'ticket'){
          const sendData = {  
            table: 'ticket', //aqui nao pode ser data.table, pois posso chamar com ele em branco pra preencher todas tabelas
            closed: data.closed, whereTable: '', whereField: '', whereValue:  '', sync: false,
          };
          await ChamadosService.getData(sendData)
          .then(
            res => {
              commit('setTickets', res);        
            }
          ).catch(
            err => {
              commit('setLoading', false);
              commit('setError', err);
              console.log(err);
            }
          );
        }; 

        if(this.getters.fornecedor == ''){
          const sendData = {  
            table: 'fornecedor', //aqui nao pode ser data.table, pois posso chamar com ele em branco pra preencher todas tabelas
            closed: '', whereTable: '', whereField: '', whereValue:  '', sync: false,
          };
          await ChamadosService.getData(sendData)
          .then(
            res => {
              commit('setFornecedor', res);        
            }
          ).catch(
            err => {
              commit('setLoading', false);
              commit('setError', err);
              console.log(err);
            }
          );
        };
      }
    },
  },
  getters: {
    fornecedor (state){
      return state.fornecedorData;
    },
    openChamados (state) {      
      return state.openChamados;
    },
    allChamados (state) {      
      return state.allChamados;
    },
    gmuds (state) {
      return state.gmuds;
    },
    tickets (state) {
      return state.tickets;
    },
    userLoggedId (state) {
      return state.userLoggedId;
    },
  }
};
