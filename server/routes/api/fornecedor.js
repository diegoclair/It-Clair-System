const express = require('express');
const router = express.Router();

const databasePostgreSql = require('./database/databasePostgreSql');


//*==================================================GET===============================================================//

//como esse arquivo foi importado no meu index-postgresql.js com '/api/users', 
//então quando aqui eu coloco apenas '/', estou me referindo ao caminho '/api/users'

router.get('/', async (req, res) => {
    const fornecedor = await databasePostgreSql.getFornecedor();
    res.send(await fornecedor);
});

//*==================================================POST===============================================================//


//*===================================================PUT================================================================//


//*==================================================DELETE=============================================================//


module.exports = router;


