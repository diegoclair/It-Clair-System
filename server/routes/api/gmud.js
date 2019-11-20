const express = require("express");
const router = express.Router();

const databasePostgreSql = require("./database/databasePostgreSql");
//const topDeskAPI = require("./topdeskAPI");
let erro_message = "";

//*==================================================GET================================================================//
//como esse arquivo foi importado no meu index-postgresql.js com '/api/gmuds',
//então quando aqui eu coloco apenas '/', estou me referindo ao caminho '/api/gmuds'
router.get("/", async (req, res) => {
  const data = {  
    table: 'gmud',
};
  const gmuds = await databasePostgreSql.readAllData(data);
  res.send(gmuds);
});

//dados da mudança:
router.post("/:changeNumber/:chamadoNumber", async (req, res) => {
  const change = await getToCreateGmud(req.params.changeNumber,req.params.chamadoNumber);
  res.send(change); //Retorna dado recebido mudanca
});

router.delete("/:changeNumber/:chamadoNumber", async (req, res) => {
  const resDelete = await databasePostgreSql.deleteGmud(
    req.params.changeNumber,
    req.params.chamadoNumber
  );
  res.send(resDelete);
});

async function getToCreateGmud(change_number, chamado_number) {
  //get from topDesk to create at postgreSql
  try {
    const dataChange = await databasePostgreSql.topDeskAPI.buscaMudancaTopDesk(change_number);
    
    if (typeof(dataChange) !== 'object') {
      if (dataChange.indexOf('Erro ') == 0) {
        erro_message = `${dataChange}`;
        console.log(erro_message);
        return erro_message;
      };
    };
    
    let gmudData = await databasePostgreSql.getTableFieldValue('gmud',dataChange);
    gmudData['num_chamado'] = chamado_number;

    if (typeof(gmudData) !== 'object') {
      if (gmudData.indexOf('Erro ') == 0) {
        erro_message = `${gmudData}`;
        console.log(erro_message);
        return erro_message; 
      };
    };

    try {          
      const resCreateGmud = await databasePostgreSql.createData('gmud', gmudData);
      
      if (resCreateGmud == true) {
        return gmudData;

      } else {
        //esse erro no else não ocorreu aqui, veio do postgresql, então apenas vou repassar o erro
        erro_message = `${resCreateGmud}`;
        //console.log(erro_message);
        return erro_message;
      }
    } catch (err) {
      erro_message = `Erro 005: ${err}`;
      return erro_message;
    }

  } catch (err) {
    erro_message = `Erro 003: ${err}`;
    return erro_message;
  }
}

module.exports = router;
