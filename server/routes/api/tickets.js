const express = require('express');
const router = express.Router();

const databasePostgreSql = require('./database/databasePostgreSql');

let erro_message = '';


//*==================================================GET================================================================//

router.get('/', async (req, res) => {
    const data = {  
      table: 'ticket',
    };
    try {
      const tickets = await databasePostgreSql.readAllData(data);
      res.send(tickets);
    } catch (error) {
      erro_message = `Erro 091: ${error}`;
      console.log(erro_message);
      return erro_message;
    }
});

//*==================================================POST===============================================================//
//create Ticket
router.post('/newTicket', async (req, res) => {
  let resCreateTotvs = '',resUpdateTopdesk = '';
  try {
    if (req.body.ticket.incluiTextoChamado) {
      resUpdateTopdesk = await databasePostgreSql.topDeskAPI.updateNewTicketTopDesk(req.body.ticket);
    };    
    try {
      resCreateTotvs = await databasePostgreSql.createData('ticket', req.body.ticket);
      } catch (error) {
        erro_message = `Erro 093: ${error}`;
        console.log(erro_message);
        return erro_message;
      }
  } catch (error) {
    erro_message = `Erro 092: ${error}`;
    console.log(erro_message);
    return erro_message;
  }
  res.send(resCreateTotvs);
});
//create fornecedor folder
router.post('/folder', async (req, res) => {
    const resCreateFolderFornecedor = await databasePostgreSql.createFolderFornecedor(req.body.data);
    res.send(resCreateFolderFornecedor);
});

//*===================================================PUT================================================================//
router.put('/updateStatus', async (req, res) => {  
    let resUpdateStatus = '';
    
    if (req.body.ticket.newStatus === 'Fechado'){
        resUpdateStatus = await databasePostgreSql.updateTable('ticket', 
            ['status',                 'versao_futura',               'dt_encerramento'], 
            [req.body.ticket.newStatus, req.body.ticket.versao_futura, req.body.ticket.dt_encerramento], 
            ['num_ticket','id_fornecedor'], [req.body.ticket.num_ticket.trim(),req.body.ticket.id_fornecedor.trim()]);
    }else{
        resUpdateStatus = await databasePostgreSql.updateTable('ticket', 
            ['status'], 
            [req.body.ticket.newStatus], 
            ['num_ticket','id_fornecedor'], [req.body.ticket.num_ticket.trim(),req.body.ticket.id_fornecedor.trim()]);
    };
    
    res.send(resUpdateStatus);
});

//*==================================================DELETE=============================================================//
//delete Ticket
router.delete('/delete/:num_chamado/:num_ticket/:id_fornecedor', async (req, res) => {
    const ticket = {
        num_chamado: req.params.num_chamado,
        num_ticket: req.params.num_ticket,
        id_fornecedor: req.params.id_fornecedor
    };
    
    const resDeleteTicket = await databasePostgreSql.deleteTicket(ticket);
    res.send(resDeleteTicket);
});

module.exports = router;