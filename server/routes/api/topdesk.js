
const express = require("express");
const axios = require('axios');
const router = express.Router();
const databasePostgreSql = require("./database/databasePostgreSql");

const urlActivity = 'https://unimedfesp.topdesk.net/tas/api/operatorChangeActivities';
const urlOneChange = 'https://unimedfesp.topdesk.net/tas/api/operatorChanges';

let erro_message = '';


//como esse arquivo foi importado no meu index-postgresql.js com '/api/topdesk',
//então quando aqui eu coloco apenas '/', estou me referindo ao caminho '/api/topdesk'
router.get("/", async (req, res) => {
  res.send(topdesk); //Retorna todos os dados dos chamados
});

//==========================================================================================================================//
setInterval(getChamadosTopDesk, 3*60000);
setInterval(syncTopDesk, 90*60000);
setInterval(getActivities, 8*60000); 

getChamadosTopDesk();
//syncTopDesk();
getActivities();

async function getChamadosTopDesk() {
  //ler os 50 últimos chamados a cada 3 minutos
  try {
    let topdesk = await databasePostgreSql.topDeskAPI.readLastsTopDesk(50);
    try {
      //passo true para criar os dados no banco de dados
      let chamadoData = await databasePostgreSql.getTableFieldValue('chamado',topdesk, true);
      
    } catch (error) {
      erro_message = `Erro 036: ${error}`;
      console.log(erro_message);
      return erro_message;
    };
  } catch (error) {
    erro_message = `Erro 038: ${error}`;
    console.log(erro_message);
    return erro_message;    
  };
  console.log("terminei");
};

async function syncTopDesk() { 
  try {
    let sync = await databasePostgreSql.syncDataTopDesk('automatic-sync');    
  } catch (error) {
    erro_message = `Erro 061: ${error}`;
    console.log(erro_message);
    return erro_message; 
  }
};

async function getActivities() { 
  try {
    console.log('getActivity');
    
    let authTopdesk = await databasePostgreSql.topDeskAPI.getAuthTopDesk();

    const urlTopDesk = `${urlActivity}?archived=false`;
    const last_activity = await databasePostgreSql.readLastActivity();
    try {
      const res = await axios.get(urlTopDesk, {
        auth: { 
          username: authTopdesk.username, 
          password: authTopdesk.password  
        }
      });
      const activities = res.data.results;
      
      const lastActivityTopDesk = activities[0].number
      const changeActivityTopDesk = activities[0].change.number
      
      let currentActivityTopDesk = '';
      
      if (last_activity[0]) {
        currentActivityTopDesk = last_activity[0].num_activity
        databasePostgreSql.updateActivityValue(lastActivityTopDesk, changeActivityTopDesk);
      }else{
        //se for nulo, vou dar um insert no DB
        databasePostgreSql.insertActivityValue(lastActivityTopDesk, changeActivityTopDesk);
      };
      
      for (let i = 0; i < activities.length; i++) {
        if (currentActivityTopDesk !== '') {
          if (activities[i].number.trim() == currentActivityTopDesk.trim()) {
            activities.splice(i);
            //se fizer o splice, já dou o break
            break;
          };
        }else{
          //se não tem valor no DB (currentActivityTopDesk), então não vou fazer o
          //splice, portanto já corto o for aqui
          break;
        }
      };

      for (let i = 0; i < activities.length; i++) {
        //aqui só tenho as atividades que não tenho no meu banco de dados
        try {
          const urlTopDesk = `${urlActivity}/${activities[i].id}`;
          let activityDetail = await axios.get(urlTopDesk, {
            auth: { 
              username: authTopdesk.username, 
              password: authTopdesk.password  
            }
          });
          try {
            const urlTopDesk = `${urlActivity}/${activities[i].id}/requests`
            let activityMoreDetails = await axios.get(urlTopDesk, {
              auth: { 
                username: authTopdesk.username, 
                password: authTopdesk.password  
              }
            });

            try {
              const urlTopDesk = `${urlOneChange}/${activities[i].change.number}`
              let changeDetail = await axios.get(urlTopDesk, {
                auth: { 
                  username: authTopdesk.username, 
                  password: authTopdesk.password  
                }
              });
              let data = {
                detail: activityDetail.data,
                more: activityMoreDetails.data.results[0],
                change: changeDetail.data,
              };
              try {
                const activityData = await databasePostgreSql.getTableFieldValue('activity', data, true);
                
              } catch (error) {
                this.erro_message = `Erro 088: ${error}`
                console.log(this.erro_message);
                return this.erro_message;
              };
            } catch (error) {
              this.erro_message = `Erro 084: ${error}`
              console.log(this.erro_message);
              return this.erro_message;
            };

          } catch (error) {
            this.erro_message = `Erro 079: ${error}`
            console.log(this.erro_message);
            return this.erro_message;
          };
        
        } catch (error) {
          this.erro_message = `Erro 078: ${error}`
          console.log(this.erro_message);
          return this.erro_message;
        };
      };
    } catch (error) {
      this.erro_message = `Erro 077: ${error}`
      console.log(this.erro_message);
      return this.erro_message;
    };
    
  } catch (error) {
    erro_message = `Erro 074: ${error}`;
    console.log(erro_message);
    return erro_message; 
  };
  console.log('activityFinish');
  return true;
};
/*********************************   Functions     ********************************* */

module.exports = router;
