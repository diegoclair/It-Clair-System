//Foi necessário fazer outro para acessar pelo topdeskAPI.js, 
//pois através dele eu não conseguia o databasePostgreSql pois no
//databasePostgreSql já acessa o topdeskAPI, então fica redundante


var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var connectDB = require('./connectionDB');

let erro_message = '';

const client = connectDB.client;

 
module.exports = {

    client,

    //*============================================READ==========================================
    readAllData: async function(data){
    
      let query = `select * from ${data.table}`;
      
      try {

        const allData = await this.client.query(query);
        return allData.rows;

      } catch (error) {
        this.erro_message = `Erro 048: ${error}`;
        console.log(this.erro_message);
        return this.erro_message;
      }
    },
}