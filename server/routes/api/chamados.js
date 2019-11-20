const express = require('express');
const router = express.Router();

const databasePostgreSql = require('./database/databasePostgreSql');
let erro_message = '';

//*==================================================GET===============================================================//

//como esse arquivo foi importado no meu index-postgresql.js com '/api/chamados', 
//entao quando aqui eu coloco apenas '/', estou me referindo ao caminho '/api/chamados'
router.post("/", async (req, res) => { 
    //tive que alterar pra post para receber objeto    
    let data = {  
        table: req.body.entryData.table,
        closed: req.body.entryData.closed,
        whereTable: req.body.entryData.whereTable,
        whereField: req.body.entryData.whereField,
        whereValue: req.body.entryData.whereValue,
        sync: req.body.entryData.sync,
    };
    
    const chamados = await databasePostgreSql.readAllData(data);
    if (chamados.indexOf('Erro') == 0 || chamados.indexOf('Alerta') == 0) {
        this.erro_message = `${chamados}`;
        console.log(this.erro_message);
        res.send(chamados);
        return this.erro_message;
    };
    let response = [];

    for (let i = 0; i < chamados.length; i++) {
        if (chamados[i].status.trim() !== 'Fechado' 
         && chamados[i].status.trim() !== 'Fechado pelo solicitante'
         && chamados[i].status.trim() !== 'Removido'
         && chamados[i].status.trim() !== 'Cancelado') {
            response.push(chamados[i]);
        }else{
          if (response.length < 150) {
            //retornar no maximo 150 registros contendo os fechados
            response.push(chamados[i])
          };
        };
      };
    res.status(200).send(response);
});
router.get('/topdesk/:login_operator', async (req, res) => {
    const chamado = await databasePostgreSql.syncDataTopDesk(req.params.login_operator);
    res.status(200).send(chamado);
});

//*==================================================POST===============================================================//
//create folder
router.post('/folder/:chamadoNumber', async (req, res) => {
    const resCreateFolder = await databasePostgreSql.createFolder(req.params.chamadoNumber);
    res.status(200).send(resCreateFolder);
});

//*===================================================PUT================================================================//
router.put('/updateStatus', async (req, res) => {   
    let resUpdateTodesk, resUpdateStatus;

    let data = {
        num_chamado: req.body.dataUpdate.num_chamado,
        status: req.body.dataUpdate.status,
        id_chamado: req.body.dataUpdate.id_chamado,
    }
    try {
        resUpdateTodesk = await databasePostgreSql.topDeskAPI.updateStatusTopDesk(data);
        if (resUpdateTodesk !== true) {
            res.send(resUpdateTodesk);
            return resUpdateTodesk;
        };
        try {
            //espero somente a alteração do topdesk, pois do db não está ocorrendo erro
            resUpdateStatus = databasePostgreSql.updateTable('chamado', ['status'], [req.body.dataUpdate.status], ['num_chamado'], [req.body.dataUpdate.num_chamado]);
            
        } catch (error) {
            this.erro_message = `Chamado: ${data.num_chamado} - Erro 056: ${error}`;
            console.log(this.erro_message);
            return this.erro_message;
        }
    } catch (error) {
        this.erro_message = `Chamado: ${data.num_chamado} - Erro 055: ${error}`;
        console.log(this.erro_message);
        return this.erro_message;
    };
    if (resUpdateTodesk == true || resUpdateTodesk == 'true') {
        res.status(200).send(true);
    }else{
        res.send(resUpdateTodesk);
    };
});

//*==================================================DELETE=============================================================//

module.exports = router;


