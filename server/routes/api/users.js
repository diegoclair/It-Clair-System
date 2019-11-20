const express = require('express');
const router = express.Router();

const databasePostgreSql = require('./database/databasePostgreSql');


//*==================================================GET===============================================================//

//como esse arquivo foi importado no meu index-postgresql.js com '/api/users', 
//então quando aqui eu coloco apenas '/', estou me referindo ao caminho '/api/users'

router.get('/logged/:id_firebase', async (req, res) => {
    const user = await databasePostgreSql.getUserLoggedData(req.params.id_firebase);
    res.send(await user);
});

//*==================================================POST===============================================================//
//create folder

router.post('/firebaseUser/:id_firebase/:login', async (req, res) => {
    const resFirebaseUser = await databasePostgreSql.createFirebaseUser(req.params.id_firebase, req.params.login);
    res.send(resFirebaseUser);
});

//*===================================================PUT================================================================//


//*==================================================DELETE=============================================================//


module.exports = router;


