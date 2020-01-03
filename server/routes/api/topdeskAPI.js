const axios = require('axios');
const postgreTopDesk = require('./database/postgreTopDesk');

//prototipo topdesk
/*const urlIncidents = 'https://unimedfesp-test.topdesk.net/tas/api/incidents';
const urlPersons = 'https://unimedfesp-test.topdesk.net/tas/api/persons';
const urlOperators = 'https://unimedfesp-test.topdesk.net/tas/api/operators';
const urlOperatorGroup = 'https://unimedfesp-test.topdesk.net/tas/api/operatorgroups';
const urlOneChange = 'https://unimedfesp-test.topdesk.net/tas/api/operatorChanges';
const urlActivity = 'https://unimedfesp-test.topdesk.net/tas/api/operatorChangeActivities';
const local = 'prot'*/

//producao
const urlIncidents = 'https://unimedfesp.topdesk.net/tas/api/incidents';
const urlPersons = 'https://unimedfesp.topdesk.net/tas/api/persons';
const urlOperators = 'https://unimedfesp.topdesk.net/tas/api/operators';
const urlOperatorGroup = 'https://unimedfesp.topdesk.net/tas/api/operatorgroups';
const urlOneChange = 'https://unimedfesp.topdesk.net/tas/api/operatorChanges';
const urlActivity = 'https://unimedfesp.topdesk.net/tas/api/operatorChangeActivities';
const local = 'prod'

let erro_message = '';

let username, password;

async function getParameters(){
    let data = {
        table: 'parameters',
    };   
    
    try {
        
        const topDeskData = await postgreTopDesk.readAllData(data);
        username = topDeskData[0].login_topdesk;
        password = topDeskData[0].pass_topdesk;
        
        return topDeskData;
    
    } catch (error) {
        this.erro_message = `Erro 051: ${error}`;
        console.log(this.erro_message);
        return this.erro_message;
    };

};

module.exports = {

  local,

//*==================================================GET===============================================================//    
  readLastsTopDesk: async function(numberOfTickets){
      await getParameters();

      if(username == null || username == undefined){
        //se der erro de conexão ele chama esse cara
        return false;
      };

      const urlTopDesk = `${urlIncidents}?page_size=${numberOfTickets}`;
      try {
        const res = await axios.get(urlTopDesk, {
            auth: { 
                username: username.trim(), 
                password: password.trim()
            }
        });
        console.log('Qtd: ' + numberOfTickets);
        return res.data
      } catch (error) {
        this.erro_message = `Erro 029: ${error}`
        console.log(this.erro_message);
        return this.erro_message;
      }
  },
  buscaPessoaTopDesk: async function (type, id) { 
      await getParameters();
              
      let urlTopDesk = '';
      if (type == 'person') {
          urlTopDesk = `${urlPersons}/id/${id}`;
      }else if (type == 'operator') {
          urlTopDesk = `${urlOperators}/id/${id}`;
      }else if (type == 'operator_group') {
          urlTopDesk = `${urlOperatorGroup}/id/${id}`;
      }
      try {
          const res = await axios.get(urlTopDesk, {
              auth: { 
                  username: username.trim(), 
                  password: password.trim()  
              }
          });
            
          return res.data
      } catch (error) {
          this.erro_message = `Erro 033: ${error}`
          console.log(this.erro_message);
          return this.erro_message;
      };
  },
  buscaMudancaTopDesk: async function (changeNumber) {
      await getParameters();
      
      //get change data
      const urlTopDesk = `${urlOneChange}/${changeNumber}`;        
      try {
          let res = await axios.get(urlTopDesk, {
              auth: { 
                  username: username.trim(), 
                  password: password.trim() 
              }
          });
          
          try {
              //get requestText of change                
              const urlMotivoTopDesk = `${urlOneChange}/${res.data.id}/requests`;

              const resMotivo = await axios.get(urlMotivoTopDesk, {
                  auth: { 
                      username: username.trim(), 
                      password: password.trim() 
                  }
              });
              
              const data = {
                  mudanca: res.data,
                  motivo: resMotivo.data
              };

              return data;
              
          } catch (err) {
              this.erro_message = `Erro 012 - Verifique se o motivo da mundança está preenchido no TopDesk: ${err}`
              return this.erro_message;
          }
      } catch (err) {
          this.erro_message = `Erro 011 - Verifique se a mudança ${changeNumber} existe no topDesk: ${err}`
          return this.erro_message;
      }
  },
  buscaChamadoTopDesk: async function (chamadoNumberOrId, type) {
    await getParameters();

    if (type == 'activity'){
      try {
        const urlTopDesk = `${urlActivity}/${chamadoNumberOrId}`;
        let activity = await axios.get(urlTopDesk, {
          auth: { 
            username: username.trim(), 
            password: password.trim()  
          }
        });
        try {
          const urlTopDesk = `${urlActivity}/${chamadoNumberOrId}/requests`;          
          let activityMore = await axios.get(urlTopDesk, {
            auth: { 
              username: username.trim(), 
              password: password.trim()  
            }
          });
          try {
            const urlTopDesk = `${urlOneChange}/${activity.data.change.number}`
            let changeDetail = await axios.get(urlTopDesk, {
              auth: { 
                username: username.trim(), 
                password: password.trim()
              }
            });

            const data = {
              detail: activity.data,
              more: activityMore.data.results[0],
              change: changeDetail.data,
            };
            return data;
          } catch (error) {
            if (error.response.status == 524) {
              this.erro_message = `Erro 089 - STATUS: ${error}`
              console.log(this.erro_message);
              return error.response.status;
            }else{
              this.erro_message = `Erro 089: ${error}`
              console.log(this.erro_message);
              return null; //retorno null para dar continue no for do sync
            }
          };
        } catch (error) {
          if (error.response.status == 524) {
            this.erro_message = `Erro 086 - STATUS: ${error}`
            console.log(this.erro_message);
            return error.response.status;
          }else {
            this.erro_message = `Erro 086: ${error}`
            console.log(this.erro_message);
            return null;
          }
        };
      } catch (error) {
        if (error.response.status == 524) {
          this.erro_message = `Erro 085 - STATUS: ${error}`
          console.log(this.erro_message);
          return error.response.status;
        }else{
          this.erro_message = `Erro 085: ${error}`
          console.log(this.erro_message);
          return null; //retorno null para dar continue no for do sync
        };
      }

    }else {
      if (type !== 'number' && type !== 'id') {
        urlTopDesk = `https://unimedfesp.topdesk.net${type}` //partial incident
      }else {
        urlTopDesk = `${urlIncidents}/${type}/${chamadoNumberOrId}`;
      };
      let res = '', resActions = '';
      try {
        res = await axios.get(urlTopDesk, {
          auth: { 
            username: username.trim(), 
            password: password.trim()  
          }
        });
        console.log('opa');
        
        const urlActions = `https://unimedfesp.topdesk.net${res.data.action}?page_size=20`
        try {
          resActions = await axios.get(urlActions, {
            auth: { 
              username: username.trim(), 
              password: password.trim()  
            }
          }); 
          console.log('retr data');

          const data = {
            chamadoData: res.data,
            actions: resActions.data
          };      
          return data;
          
        } catch (error) {
          if (error.response.status == 524) {
            this.erro_message = `Erro 103 - STATUS: ${error}`
            console.log(this.erro_message);
            return error.response.status;
          }

          this.erro_message = `Erro 103: ${error}`
          console.log(this.erro_message);
          return null;
          
        };        
      } catch (error) {                
        if (error.response.status == 524) {
          this.erro_message = `Erro 030 - STATUS: ${error}`
          console.log(this.erro_message);
          return error.response.status;
        }
        this.erro_message = `Erro 030: ${error}`
        console.log(this.erro_message);
        return null; //retorno null para dar continue no for do sync
        
      };
    };
  },
  getAuthTopDesk: async function () {  
    await getParameters();
    const auth = {
      username: username.trim(), 
      password: password.trim()  
    };
    return auth;
  },

//*===================================================PUT===============================================================//
  updateStatusTopDesk: async function(data){
    await getParameters();        

    if(username == null || username == undefined){
        //se der erro de conexão ele chama esse cara
        return false;
    };
    if (data.status == 'Aguardando especialista') {
      data.status = 'Em andamento especialista';
    };

    if (postgreTopDesk.client.host == 'localhost' || postgreTopDesk.client.database == 'itclair_prot') {            
      //banco de dados de protótipo
      console.log('retornei');
      return true;
    };

    if (data.num_chamado.trim().length == 11 || data.num_chamado.trim().length == 14) {
      //11 - incident ; 14 partial incident
      try {
        const urlTopDesk = `${urlIncidents}/id/${data.id_chamado}`;
        //axios.put(url[, data[, config]])        
        const res = await axios.put(urlTopDesk, {
          "processingStatus" : { 
              "name" : `${data.status}`
          },
        },
        {
          auth: { 
            username: username.trim(), 
            password: password.trim()
          },
          headers: {
            "Content-Type": "application/json"
          }
        });
        return true;
      } catch (error) {
        this.erro_message = `Erro 057: ${error}`
        console.log(this.erro_message);
        return this.erro_message;
      };
    }else{
      //activity
      try {
        const urlTopDesk = `${urlActivity}/${data.id_chamado}`;
        //axios.put(url[, data[, config]])
        const res = await axios.patch(urlTopDesk, [{
          "op": "replace", 
          "path": "/status",
          "value": `${data.status}`
        }],
        {
          auth: { 
            username: username.trim(), 
            password: password.trim()
          },
          headers: {
            "Content-Type": "application/json-patch+json"
          }
        });
        return true;
      } catch (error) {
        this.erro_message = `Erro 090: ${error}`
        console.log(this.erro_message);
        return this.erro_message;
      };
    };
  },
  sentMessageToTopdesk: async function (data) {
    await getParameters();
    if(username == null || username == undefined){
      //se der erro de conexão ele chama esse cara
      return false;
    };
    if (postgreTopDesk.client.host == 'localhost' || postgreTopDesk.client.database == 'itclair_prot') {            
      //banco de dados de protótipo
      console.log('retornei');
      return true;
    };

    if (data.num_chamado.trim().length == 11 || data.num_chamado.trim().length == 14) {
      //11 - incident ; 14 partial incident
      try {        
        const texto = data.message.replace(/\n/g,"<br>");        
        const urlTopDesk = `${urlIncidents}/id/${data.id_chamado}`;
        //axios.put(url[, data[, config]])
        const res = await axios.put(urlTopDesk, {
          "action" : `${texto}`,
        },
        {
          auth: { 
            username: username.trim(), 
            password: password.trim()
          },
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        return true;
      } catch (error) {
        this.erro_message = `Erro 099: ${error}`
        console.log(this.erro_message);
        return this.erro_message;
      };
    }else{
      //activity
      try {
        const urlTopDesk = `${urlActivity}/${data.id_chamado}/progresstrail`;
        
        const res = await axios.post(urlTopDesk, {
          "type": "memo",
          "memoText" : `${data.message}`,
        },
        {
          auth: { 
            username: username.trim(),
            password: password.trim()
          },
          headers: {
            "Content-Type": "application/json"
          },
        });
        return true;
      } catch (error) {
        this.erro_message = `Erro 100: ${error}`
        console.log(this.erro_message);
        return this.erro_message;
      };
    };    
  },
  updateNewTicketTopDesk: async function (data) { 
    await getParameters();        

    if(username == null || username == undefined){
        //se der erro de conexão ele chama esse cara
        return false;
    };
    if (postgreTopDesk.client.host == 'localhost' || postgreTopDesk.client.database == 'itclair_prot') {            
      //banco de dados de protótipo
      console.log('retornei');
      return true;
    };
    
    let fornecedor = '';
    if (data.id_fornecedor == '1') {
      fornecedor = 'Totvs'
    }else if (data.id_fornecedor == '2') {
      fornecedor = 'Unimed do Brasil'
    }else if (data.id_fornecedor == '3') {
      fornecedor = 'Plusoft'
    }else if (data.id_fornecedor == '4') {
      fornecedor = 'Projuris'
    }else if (data.id_fornecedor == '5') {
      fornecedor = 'Nekit'
    }else if (data.id_fornecedor == '6') {
      fornecedor = 'Penso'
    }else if (data.id_fornecedor == '7') {
      fornecedor = 'Wisetag'
    };

    if (data.num_chamado.trim().length == 11 || data.num_chamado.trim().length == 14) {
      //11 - incident ; 14 partial incident
      try {
        let texto = `${data.nome_solicitante}, <br><br>Foi aberto um ticket n° ${data.num_ticket} para ${fornecedor} avaliar. <br><br>Assim que tivermos um posicionamento, lhe informaremos.`
        const urlTopDesk = `${urlIncidents}/id/${data.id_chamado}`;
        //axios.put(url[, data[, config]])
        const res = await axios.put(urlTopDesk, {
          "action" : `${texto}`,
          "actionInvisibleForCaller": `${data.incluiTextoChamadoInvisivel}`
        },
        {
          auth: { 
            username: username.trim(), 
            password: password.trim()
          },
          headers: {
            "Content-Type": "application/json"
          }
        });
        return true;
      } catch (error) {
        this.erro_message = `Erro 094: ${error}`
        console.log(this.erro_message);
        return this.erro_message;
      };
    }else{
      //activity
      try {
        let texto = `${data.nome_solicitante}, \n\nFoi aberto um ticket n° ${data.num_ticket} para ${fornecedor} avaliar. \n\nAssim que tivermos um posicionamento, lhe informaremos.`
        const urlTopDesk = `${urlActivity}/${data.id_chamado}/progresstrail`;
        const res = await axios.post(urlTopDesk, {
          "type": "memo",
          "memoText" : `${texto}`,
          /* "invisibleForCaller": `${data.incluiTextoChamadoInvisivel}` */
        },
        {
          auth: { 
            username: username.trim(),
            password: password.trim()
          },
          headers: {
            "Content-Type": "application/json"
          },
        });
        return true;
      } catch (error) {
        this.erro_message = `Erro 095: ${error}`
        console.log(this.erro_message);
        return this.erro_message;
      };
    };
  },
}
