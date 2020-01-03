/** 
 * TODO:
 * Na hora de incluir o ticket, verificar se eu acho o número do chamado no titulo,
 * se eu achar, então eu removo, pois não precisa incluir no ticket, pois eu já tenho esse campo
 * na tabela dos tickets para qualquer fornecedor, se eu precisar exportar um excel, posso incluir
 * o número do chamado no titulo
 * 
 * Criar um serviço por trás que ficará lendo os chamados fechados até uma certa data e consultando no 
 * topdesk se foi respondido a pesquisa de satisfação
 * 
 * Fazer update de rollback e programs da tabela 'gmud' na função syncDataTopDesk
 * 
 * Verificar necessidade de criar grupo manager na linha (tp_operator = 'manager'), pois só é criado
 * operator, operator_group e person 
 */

var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
const topDeskAPI = require('../topdeskAPI');
var connectDB = require('./connectionDB');

let erro_message = '';

const client = connectDB.client;

async function selectData(table,whereFields,whereValues) {
  let query = '';

  if (whereFields !== null && whereFields !== undefined) {
    const where = await whereObjectToValue(whereFields,whereValues);
    query = `select * from ${table} where ${where}`;
  }else {
    query = `select * from ${table}`;
  };
  
  try {
    const resCheck = await client.query(query);    
    return resCheck.rows;

  } catch (err) {
    this.erro_message = `Erro 007: ${err}`;
    console.log(this.erro_message);
    return this.erro_message;
  }
};
async function createPessoa(table,id_recebido) {
  //table = 'person'   - solicitante
  //table = 'operator' - operadores
  let id = '';
  let data = {};
  
  if (!await existePostgreSql(table,[`id_${table}`],[id_recebido])) {
    
    try {
      let dataPerson = '';

      dataPerson = await topDeskAPI.buscaPessoaTopDesk(table, id_recebido);

      if (typeof(dataPerson) !== 'object') {
        if (dataPerson.indexOf('Error') !== 0) {
          return dataPerson;
        };
      };

      if (table == 'person' || table == 'operator') {
        
        id = dataPerson.id;
        const first_name = dataPerson.firstName;
        const full_name = dataPerson.dynamicName;        
        const email = dataPerson.email;
        
        let phone = '';
        let login = '';
        if (table == 'person') {
          phone = dataPerson.phoneNumber;
          login = dataPerson.tasLoginName;
        }else if (table == 'operator') {
          phone = dataPerson.telephone;
          login = dataPerson.loginName.toLowerCase();
        };

        let departamento = "";
        if (dataPerson.department == null) {
          departamento = "";
        } else {
          departamento = dataPerson.department.name;
        };
        let filial = "";
        if (dataPerson.branch == null) {
          filial = "";
        } else {
          filial = dataPerson.branch.name;
        };
              
        data = {
          first_name,
          full_name,
          phone,
          email,
          login,
          departamento,
          filial,
        };
        //variavel id_person ou id_operator
        data[`id_${table}`] = id;

      }else if (table == 'operator_group') {
        //para tabela person e tabela operator provalvelmente o dataPerson.id não volta nulo
        //se voltar nulo, então vou buscar na tabela de grupos de operadores

        id = dataPerson.id;
        group_name = dataPerson.groupName;

        data = {
          group_name
        };
        data[`id_${table}`] = id;
      };

      const resReadObject = await insertObjectToValue(data);
      const fieldsObject = resReadObject.field;
      const valuesObject = resReadObject.value;

      const query = `INSERT INTO ${table} ${fieldsObject} ${valuesObject};`

      const resultCreate = await client.query(query);

      return true;
    } catch (error) {
      console.log(`Erro 031: ${error}`);
      return false;
    }
  }
};
async function existePostgreSql(table, whereFields, whereValues) {
  /*example to call this function: 
    existePostgreSql('gmud', ["num_gmud","num_chamado"], ["M1905-02270","I1903-00050"])
  */
  const where = await whereObjectToValue(whereFields,whereValues);
  let query = `select * from ${table} where ${where}`;

  try {

    const resCheck = await client.query(query);
    const exists = JSON.stringify(resCheck.rowCount); //quantidade de itens existentes

    //se  exists == 0 , significa que não existe registro, então retornar false
    const res = exists == 0 ?  false : true;

    return res;

  } catch (err) {
    this.erro_message = `Erro 002: ${err}`;
    console.log(this.erro_message);
    return this.erro_message;
  } 

};
async function getOptionalsIdFirebase(id_firebase) {  
  let resSelectFirebase = '', resCheckUserFirebase = '';

  try {
    resSelectFirebase = await selectData('firebaseuser',['firebaseuser.id_firebase'],[id_firebase]);

    if (resSelectFirebase == null || resSelectFirebase == undefined || resSelectFirebase == '') {
      //situações como essa acontecia apenas quando eu mudava de banco de dados, pois o usuário existia no 
      //firebase, mas não existia no postgresql... Verificar se o banco está correto
      this.erro_message = `Erro 063: Não econtrado usuario no banco de dados, contate administrador`;
      console.log(this.erro_message);
      return this.erro_message;
    };
    
  } catch (error) {
    this.erro_message = `Erro 070: ${error}`;
    console.log(this.erro_message);
    return this.erro_message;
  };

  try {
    resCheckUserFirebase = await checkUserFirebase(resSelectFirebase);
    
  } catch (error) {
    this.erro_message = `Erro 071: ${error}`;
    console.log(this.erro_message);
    return this.erro_message;
  };
  
  if (resCheckUserFirebase == false) {
    //se não existir operador, já retorno aqui o alerta
    this.erro_message = `Alerta 003: Nenhum chamado encontrado para o login de rede: ${resSelectFirebase[0].login.trim()}`;
    console.log(this.erro_message);
    return this.erro_message;
  }else{
    //se retornar true, então achei e atualizei a tabela, dessa forma, vou ler novamente p/ poder pegar o id_operator
    resSelectFirebase = await selectData('firebaseuser',['firebaseuser.id_firebase'],[id_firebase]);
  };
  
  const id_operator = resSelectFirebase[0].id_operator.trim();
  const login_operador = resSelectFirebase[0].login.trim();

  return `chamado.id_operator = '${id_operator}'`;
}
async function insertObjectToValue(object){
  let field = '';
  let value = '';
  for (let i = 0; i < Object.keys(object).length; i++) {
    //Verificar não encaminhar campos nulos
    if (Object.values(object)[i] == null) {
      if (i == 0) {        
        //se o primeiro campo for nulo
        field += `(`
        value += ` VALUES (`
      } else if (i+1 == Object.keys(object).length) {
        if(field[field.length -1] == ','){
          //se o ultimo campo for null e foi colocado virgula no campo, eu removo
          field = field.slice(0, -1);
          value = value.slice(0, -1);
        }
        field += `)`
        value += `)`
      }
      continue;
    }

    if (i == 0) {        
      //quando for o primeiro item
      field += `(${Object.keys(object)[i]},`
      value += ` VALUES ('${Object.values(object)[i]}',`
    } else{
      if (i+1 == Object.keys(object).length) {
        //quando for o último item
        field += `${Object.keys(object)[i]})`
        value += `'${Object.values(object)[i]}')`
      }else{
        field += `${Object.keys(object)[i]},`
        value += `'${Object.values(object)[i]}',`
      }
    }
  };
  const data = {
    field,
    value
  }
  return data;
};
async function whereObjectToValue(field, value){
  let selectFields = '';
  let query = '';

  //se não mandar esse campo, então faço só o select
  if (field === null || field === undefined ) {
    query = ``;
  } else {
    if (field.length == value.length) {
      
      for (let i = 0; i < field.length; i++) {
        if ((i + 1) == field.length) {
          selectFields += `${field[i]} = '${value[i]}'`     //sem and
        } else{
          selectFields += `${field[i]} = '${value[i]}' and `  //com and
        };
      };
      
      query = `${selectFields}`;
      
    } else {
      this.erro_message = `Erro 034: Parametros 'field' e 'value' com tamanhos diferentes`;
      console.log(this.erro_message);
      return this.erro_message;
    };
  };
  return query;
  
};
async function removeSpecialCharacters(text) { 
  const title = text;
  let cleanText = title.replace(/[\/\\":*<>'|]/g, '-');
  cleanText = cleanText.replace(/[?]/g, 'Interrogação');
  
  return cleanText;
};
async function localUpdateTable(table, fields, values, whereField, whereValue){
  /*example to call this function: 
    updateTable('chamado', ["test1","test2","test3"], ["val1","val2","val3"], ['num_chamado'], ['I1903-00050'])
  */
  let updateFields = '';  

  if (fields.length == values.length) {
    for (let i = 0; i < fields.length; i++) {
      if (i + 1 == fields.length) {
        updateFields += `${fields[i]} = '${values[i]}'`; //sem virgula
      } else {
        updateFields += `${fields[i]} = '${values[i]}',`; //com virgula
      };
    };
    const whereConditions = await whereObjectToValue(whereField,whereValue);
    let query = ''
    try {
      //query = `UPDATE ${table} SET ${updateFields} where ${whereField} = '${whereValue}'`;
      query = `UPDATE ${table} SET ${updateFields} where ${whereConditions}`;
      
      const resultUpdate = await client.query(query);
      const updatedCount = JSON.stringify(resultUpdate.rowCount); //quantidade de itens atualizados

      if (updatedCount == 0) {
        this.erro_message = `Erro 054 - update Retornou 0 - ${query}`;
        console.log(this.erro_message);
        return this.erro_message;
      };
      return true;

    } catch (error) {
      this.erro_message = `Erro 040: ${query} - ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };
  } else {
    this.erro_message = `databasePostgreSql.js - function updateTable: Parametros 'whereFields' e 'whereValues' com tamanhos diferentes`;
    console.log(this.erro_message);
    return this.erro_message;
  };
};
async function checkUserFirebase(data){
  if (data[0].id_operator !== null && data[0].id_operator !== undefined ) {
    return true;
  }else{    
    const resCheckOperator = await selectData('operator',['login'],[data[0].login.trim()]);

    if (resCheckOperator[0] == null || resCheckOperator[0] == undefined) {
      //se não retornar nada da tabele operador, então ainda não entrou um chamado para esse
      //operador e não foi criado a tabela operador
      return false;
    }else if (resCheckOperator[0].id_operator !== null && resCheckOperator[0].id_operator !== undefined ) {
      const resUpdate = await localUpdateTable('firebaseuser',['id_operator'],[resCheckOperator[0].id_operator],
                                                ['login'],[resCheckOperator[0].login]);
      if (resUpdate == true) {
        return true;
      }else{
        return false;
      }
    };
    //se não achei operador, então não entrou nenhum chamado ainda com esse login..
    //retorno falso se não existe operador
    return false;
  }
};
module.exports = {

  client,
  topDeskAPI,

  getTableFieldValue: async function(table, dataReceived, create){
    let data = dataReceived
    let actions = [];    
    let chamadoData = '', activityData = '';
    
    if (table == 'chamado') {
      
      if (data !== null && data !== undefined) {        
        if (dataReceived[0].actions !== null && dataReceived[0].actions !== undefined) {
          actions[0] = dataReceived[0].actions
          data[0] = dataReceived[0].chamadoData
        };
        
        for (let i = 0; i < data.length; i++) {
          
          var link = ''
          try {
            if (topDeskAPI.local == 'prot') {
              link = "https://unimedfesp-test.topdesk.net/tas/secure/incident?unid=";
            }else if (topDeskAPI.local == 'prod') {
              link = "https://unimedfesp.topdesk.net/tas/secure/incident?unid=";
            };
            
            var id_chamado = data[i].id;
            
            var newId = id_chamado.replace(/-/g, ""); //retirado os ifens
            var link_chamado = link + newId;

            var originalRequest = data[i].request;
            var originalRequestSpaces = originalRequest.substring(originalRequest.indexOf("Descrição"));  //retira tudo que está antes da palavra Descrição
            var texto_abertura = originalRequestSpaces.replace(/\n\n\n/g, '\n\n').replace(/'/g, '');      //substitui 3 quebras de linha por 2 e remove'
            var texto_ult_retorno = '';
            
            if (actions[i] !== null && actions[i] !== undefined) {
              let operator = false, caller = false;
              for (let ix = 0; ix < actions[i].length; ix++) {
                if (actions[i][ix].memoText !== null && actions[i][ix].memoText !== undefined) {
                  if ((actions[i][ix].person !== null && actions[i][ix].person !== undefined) ||
                      (actions[i][ix].operator !== null && actions[i][ix].operator !== undefined)) {

                    if ((actions[i][ix].operator !== null && actions[i][ix].operator !== undefined) && operator == false) {
                      texto_ult_retorno += actions[i][ix].memoText.replace(/<br\/>/g,'\n').replace(/\n\n\n/g, '\n\n').replace(/'/g, ''); //substitui 3 quebras de linha por 2 e remove'
                      texto_ult_retorno = 'operator:' + texto_ult_retorno;
                      operator = true
                    };
                    if ((actions[i][ix].person !== null && actions[i][ix].person !== undefined) && person == false) {
                    texto_ult_retorno += actions[i][ix].memoText.replace(/<br\/>/g,'\n').replace(/\n\n\n/g, '\n\n').replace(/'/g, ''); //substitui 3 quebras de linha por 2 e remove'
                    texto_ult_retorno = 'caller:' + texto_ult_retorno;
                    caller = true;
                  };
                  if (caller && person) {
                    break;                          
                  };
                  };
                }; 
              };
            };
            
            var num_chamado = data[i].number.replace(/[\\\\]/g, '/');
            var id_solicitante = data[i].caller.id;

            var id_operator = data[i].operator.id;
            var tp_operator = data[i].operator.status;
            var operator = data[i].operator.name;

            var titulo = data[i].briefDescription.replace(/'/g, '');
            var categoria = data[i].operatorGroup !== null ? data[i].operatorGroup.name : ''; //tinha um chamado que o utyama assumiu e fechou e ele não tinha grupo
            var dt_encerramento = data[i].closedDate;
            var feedback_message = data[i].feedbackMessage;
            var feedback_rating = data[i].feedbackRating;

            var partialIncidents = data[i].partialIncidents;
            
            var dt_abertura = data[i].creationDate;
            var dt_ult_retorno = data[i].modificationDate !== null ? data[i].modificationDate : dt_abertura ;

            var status = "";
            if (data[i].processingStatus == null) {
              status = "Em Aberto";
            } else {
              if (data[i].processingStatus.name == "Em andamento especialista") {
                status = "Aguardando especialista";
              } else {
                status = data[i].processingStatus.name;
              };
            };
            
          } catch (error) {
            //tinha o chamado I1909-00966 que não tinha praticamente nenhum dado nos campos
            //pois era um chamado de teste e portanto eu dei um trycatch
            erro_message = `Erro 041: ${error}`
            console.log(`${data[i].number} - ${erro_message}`);
            continue;
          };
          try {
            const resultCreatePerson = await createPessoa('person', id_solicitante);
            try {
              if (tp_operator == 'operator') {
                const resultCreateOperator = await createPessoa('operator', id_operator);
              }else if (tp_operator == 'operatorGroup') {
                const resultCreateOperatorGroup = await createPessoa('operator_group',id_operator);
              };
            } catch (error) {
              this.erro_message = `Erro 042: ${error}`;
              console.log(this.erro_message);
              return this.erro_message;
            };
          } catch (error) {
            this.erro_message = `Erro 043: ${error}`;
            console.log(this.erro_message);
            return this.erro_message;
          };

          chamadoData = {
            id_chamado,
            num_chamado,
            dt_abertura,
            dt_ult_retorno,
            id_solicitante,
            id_operator,
            tp_operator,
            operator,
            status,
            titulo,
            categoria,
            texto_abertura,
            texto_ult_retorno,
            link_chamado,
            dt_encerramento,
            feedback_rating,
            feedback_message,
            partialIncidents,
          };
          if (create) {
            try {
              const resCreate = await this.createChamadoTopdesk('chamado',chamadoData);
              if (resCreate == false){
                //quando eu achar um chamado, vou retornar false, e ai posso parar o for para
                //não ficar lendo chamados a toa
                break;
              };
              
            } catch (error) {
              erro_message = `Erro 037: ${error}`;
              console.log(erro_message);
              return erro_message; 
            }
          };
        }
      } else {
        erro_message = `Erro 035: TopDesk nulo`;
        console.log(erro_message);
        return erro_message;
      };

      return chamadoData;
    };

    if (table == 'activity') {
      if (typeof data == 'object') {
      
        var link = '';
        try {
          if (topDeskAPI.local == 'prot') {
            link = "https://unimedfesp-test.topdesk.net/tas/secure/changeactivity?unid=";
          }else if (topDeskAPI.local == 'prod') {
            link = "https://unimedfesp.topdesk.net/tas/secure/changeactivity?unid=";
          };
          
          var id_chamado = data.detail.id;
          
          var newId = id_chamado.replace(/-/g, ""); //retirado os ifens
          var link_chamado = link + newId;
          
          var originalRequest = data.more !== null && data.more !== undefined ? data.more.memoText : '';
          var texto_abertura = originalRequest.replace(/\n\n\n/g, '\n\n').replace(/'/g, '').replace(/<br\s*[\/]?>/gi, '\n'); 
          //substitui 3 quebras de linha por 2 e remove' e remove <br/>
          
          var num_chamado = data.detail.number.replace(/[\\\\]/g, '/');
          
          var id_solicitante = data.change.requester.id;

          var id_operator = data.detail.assignee.id !== null ? data.detail.assignee.id : data.detail.assignee.groupId;
          var operator = data.detail.assignee.name !== null ? data.detail.assignee.name : data.detail.assignee.groupName;

          var tp_operator = '';

          if (data.detail.assignee.id && data.detail.assignee.groupId) {
            if (data.detail.assignee.id.trim() == data.detail.assignee.groupId.trim()) {
              tp_operator = 'operatorGroup';
            }else{
              if (data.detail.assignee.type.trim() == 'manager') {
                //ainda não crio nada de manager
                tp_operator = 'manager';
              }else{
                tp_operator = 'operator';
              };
            };
          }else{
            if (data.detail.assignee.type.trim() == 'manager') {
              tp_operator = 'manager';
              //pelo que entendi, manager é pessoa..
            }else{
              tp_operator = 'operator';
            };
          };
          
          var titulo = data.detail.briefDescription.replace(/'/g, '');

          var categoria  = '';
          if (data.detail.category) {
            categoria = data.detail.category.name;
          }else if (data.detail.assignee.groupName) {
            categoria = data.detail.assignee.groupName;
          }else {
            categoria = data.detail.optionalFields1.searchlist2.name;
          };
        
          var dt_encerramento = data.detail.finalDate;
          var feedback_message = null; //para atividade não tem
          var feedback_rating = null; //para atividade não tem

          var partialIncidents = null; //para atividade não tem;
          
          var dt_abertura = data.detail.creationDate;
          var dt_ult_retorno = data.detail.lastModificationDate !== null ? data.detail.lastModificationDate : dt_abertura ;

          var status = '';
          if (data.detail.status.name == null) {
            status = 'Em Aberto';
          } else {
            status = data.detail.status.name;
          };
          
        } catch (error) {
          //tinha o chamado I1909-00966 que não tinha praticamente nenhum dado nos campos
          //pois era um chamado de teste e portanto eu dei um trycatch
          erro_message = `Erro 080: ${error}`
          console.log(`${data.detail.number} - ${erro_message}`);
          return erro_message;
        };

        try {
          const resultCreatePerson = await createPessoa('person', id_solicitante);
          try {
            if (tp_operator == 'operator') {
              const resultCreateOperator = await createPessoa('operator', id_operator);
            }else if (tp_operator == 'operatorGroup') {
              const resultCreateOperatorGroup = await createPessoa('operator_group',id_operator);
            };
          } catch (error) {
            this.erro_message = `Erro 087: ${error}`;
            console.log(this.erro_message);
            return this.erro_message;
          };
        } catch (error) {
          this.erro_message = `Erro 081: ${error}`;
          console.log(this.erro_message);
          return this.erro_message;
        };        

        activityData = {
          id_chamado,
          num_chamado,
          dt_abertura,
          dt_ult_retorno,
          id_solicitante,
          id_operator,
          tp_operator,
          operator,
          status,
          titulo,
          categoria,
          texto_abertura,
          link_chamado,
          dt_encerramento,
          feedback_rating,
          feedback_message,
          partialIncidents,
        };
        if (create) {
          try {
            const resCreate = await this.createChamadoTopdesk('chamado',activityData);
          } catch (error) {
            erro_message = `Erro 082: ${error}`;
            console.log(erro_message);
            return erro_message; 
          }
        };
        
      } else {
        erro_message = `Erro 083: TopDesk nulo`;
        console.log(erro_message);
        return erro_message;
      };

      return activityData;
    };
    
    if (table == 'gmud') {

      if (typeof data == 'object') {
        var num_gmud = data.mudanca.number;
        try {
          //try salvar variáveis, se ocorrer algum erro, apresenta o erro no catch
          var id_solicitante = data.mudanca.requester.id;
          
          var originalMotivo = data.motivo.results[0].memoText;
          var motivoWithAfterTrash = originalMotivo.substring(originalMotivo.indexOf("Motivo")); //retira tudo que está antes da palavra Motivo
          var motivoToReplace = motivoWithAfterTrash.split("<br/><br/>Pontos de Atenção")[0]; //retira tudo que está apos esse Pontos de att(que vem logo dps do Motivo)
          var motivoSpace = motivoToReplace.replace(/<br\/>/g, "\n").replace(/'/g, ''); //substitui a quebra de linha e '
          var motivo = motivoSpace.replace(/\n\n\n/g, "\n\n"); //substitui 3 quebras de linha por 2
          
          var link = ''
          if (topDeskAPI.local == 'prot') {
            link = "https://unimedfesp-test.topdesk.net/tas/secure/newchange?unid=";
          }else if (topDeskAPI.local == 'prod') {
            link = "https://unimedfesp.topdesk.net/tas/secure/newchange?unid=";
          };
          
          var id_gmud = data.mudanca.id;
          var newId = id_gmud.replace(/-/g, ""); //retirado os ifens
          var link_gmud = link + newId;
          
          var categoria = '';
          if (data.mudanca.subcategory == null || data.mudanca.subcategory == undefined) {
            categoria = data.mudanca.category.name;
          }else{
            categoria = data.mudanca.subcategory.name;
          };
          var status = data.mudanca.status.name;
          var full_dt_abertura = data.mudanca.creationDate;
          var dt_abertura = full_dt_abertura.substring(0, 10);
          var full_dt_encerramento = data.mudanca.lastModificationDate;
          var dt_encerramento = full_dt_encerramento.substring(0, 10);
          var titulo = data.mudanca.briefDescription;
           
        } catch (err) {
          
          erro_message = `Erro 004 - Algum campo não foi preenchido na mudança ${num_gmud}, verifique no TopDesk ..> ${err}`;
          //console.log(erro_message);
          return erro_message;
        }
      } else {
        erro_message = data;
        return erro_message;
      };

      try {
        const resultCreatePerson = await createPessoa('person', id_solicitante);
      } catch (err) {
        this.erro_message = `Erro 044: ${err}`;
        console.log(this.erro_message);
        return this.erro_message;
      };

      //dps de conseguir salvar as variáveis acima, retorno os dados da GMUD,
      const gmudData = {
        id_gmud,
        num_gmud,
        id_solicitante,
        categoria,
        status,
        dt_abertura,
        dt_encerramento,
        titulo,
        motivo,
        link_gmud
      };
      return gmudData;
    };

  },

  alteraChamadoDiferenteTopdeskDB: async function (dadosDB, newDataTopDesk, altera) {  

    try {
      const dur = newDataTopDesk.dt_ult_retorno.trim(); 
      
      var yyyy = dur.substr(0, 4);
      var mm = dur.substr(5, 2);
      var dd = dur.substr(8, 2);
      const dt_ult_retorno = dd + '/' + mm + '/'+ yyyy;

      let operator_id = '';
      if (dadosDB.id_operator) {
        //se o id não for null
        operator_id = dadosDB.id_operator.trim();
      }else{
        operator_id = dadosDB.id_operator_group.trim();
      };

  
      if (dadosDB.status.trim() !== newDataTopDesk.status.trim()
        || dadosDB.id_solicitante.trim() !== newDataTopDesk.id_solicitante.trim()
        || dadosDB.categoria.trim() !== newDataTopDesk.categoria.trim()
        || dadosDB.titulo.trim() !== newDataTopDesk.titulo.trim()
        || dadosDB.f_dt_ult_retorno.trim() !== dt_ult_retorno
        || operator_id !== newDataTopDesk.id_operator.trim()
        || dadosDB.operator.trim() !== newDataTopDesk.operator.trim()
        || altera) {
        
        let status = newDataTopDesk.status.trim();
        let statusDB = dadosDB.status.trim();
        let update = true;

        //se o novo status estiver fechado, vou verificar se ticket aberto
        if (status == 'Fechado' || status == 'Fechado pelo solicitante') {
          const selectTicket = await selectData('ticket', ['num_chamado'],[dadosDB.num_chamado]);
          
          for (let i = 0; i < selectTicket.length; i++) {
            if (selectTicket[i].status.trim() !== 'Fechado') {
              if (statusDB !== 'Somente fornecedor') {
                status = 'Somente fornecedor'
              }else{
                //se o status do ticket for diferente de fechado e na tabela chamado já estiver com
                //status somente fornecedor, então eu não dou update (performance)
                update = false;
              };
            };
          };
        };
        if (update) {
          const resUpdateChamado = await this.updateTable('chamado',
            ['status','titulo','categoria','id_solicitante','id_operator','operator','tp_operator','dt_ult_retorno','dt_encerramento',
            'feedback_message','feedback_rating','texto_ult_retorno'],
            [status,newDataTopDesk.titulo,newDataTopDesk.categoria,newDataTopDesk.id_solicitante,newDataTopDesk.id_operator,newDataTopDesk.operator,
            newDataTopDesk.tp_operator,newDataTopDesk.dt_ult_retorno,newDataTopDesk.dt_encerramento == null || newDataTopDesk.dt_encerramento == undefined ? '-infinity' : newDataTopDesk.dt_encerramento,
            newDataTopDesk.feedback_message,newDataTopDesk.feedback_rating == null || newDataTopDesk.feedback_rating == undefined ? '' : newDataTopDesk.feedback_rating, 
            newDataTopDesk.texto_ult_retorno], 
            ['num_chamado'], [newDataTopDesk.num_chamado]);
              
          if (resUpdateChamado !== true) {
            //se der erro no update, retorna o erro
            return resUpdateChamado;
          };
        };
      };
    } catch (error) {
      this.erro_message = `Erro 096 - ${dadosDB.num_chamado} : ${error}`;
      //console.log(dadosDB);
      
      console.log(this.erro_message);
      return this.erro_message;
    }
    
    return true;
  },

  //*============================================READ==========================================
  readAllData: async function(data){
    //ele só lista os chamados/gmuds se a pessoa tiver criada no banco de dados por conta desse inner join
    //portanto se eu tiver 20 chamados de pessoas diferentes e somente 5 pessoas cadastradas, ele vai me listar
    //apenas os esses 5 chamados que tem essas 5 pessoas criadas
    
    let fields = '', aliasPerson = '', aliasOperator = '',aliasFornecedor = '', toChar = '';

    let whereOpens = '', whereOptionals = '', leftJoin = '', oderBy = '';

    fields += `${data.table}.titulo,${data.table}.categoria,${data.table}.status,`;
    
    if (data.whereTable !== '') {
      if (data.whereTable == 'firebaseuser') {
        try {
          whereOptionals = await getOptionalsIdFirebase(data.whereValue.trim());
          
          if (whereOptionals.indexOf('Erro') == 0 || whereOptionals.indexOf('Alerta') == 0) {
            this.erro_message = `Erro 072: ${whereOptionals}`;
            console.log(this.erro_message);
            return this.erro_message;
          }; 
        } catch (error) {
          this.erro_message = `Erro 069: ${error}`;
          console.log(this.erro_message);
          return this.erro_message;
        };
      }else{
        whereOptionals = await whereObjectToValue(data.whereField, data.whereValue);
      };
    };

    try {
      toChar = "TO_CHAR(dt_abertura, 'DD/MM/YYYY') as f_dt_abertura, TO_CHAR(dt_encerramento, 'DD/MM/YYYY') as f_dt_encerramento";

      if (data.table == 'chamado') {
        fields += 'chamado.num_chamado,chamado.link_chamado,chamado.id_chamado, chamado.id_solicitante,';
        fields += 'chamado.fornecedor,chamado.gmud,chamado.texto_abertura,chamado.texto_ult_retorno,chamado.id_operator,chamado.operator' ;

        toChar += `, TO_CHAR(dt_ult_retorno, 'DD/MM/YYYY') as f_dt_ult_retorno`;

        leftJoin += `left join operator on operator.id_operator = ${data.table}.id_operator `;
        leftJoin += `left join operator_group on operator_group.id_operator_group = ${data.table}.id_operator `;

        aliasOperator = `, operator.login as o_login, operator.full_name as o_full_name, operator.first_name as o_first_name, `;
        aliasOperator += `operator.phone as o_phone, operator.email as o_email, operator.departamento as o_departamento, `;
        aliasOperator += `operator.filial as o_filial, operator.id_operator as o_id_operator`;

        if (data.closed == false || data.closed == 'false') {
          whereOpens = `chamado.status <> 'Fechado' and chamado.status <> 'Fechado pelo solicitante'`;
          whereOpens += `and chamado.status <> 'Removido' and chamado.status <> 'Cancelado'`
        };
      };

      if (data.table == 'gmud') {
        fields += 'gmud.num_chamado,gmud.num_gmud,gmud.motivo,gmud.categoria,gmud.link_gmud';
      };

      if (data.table == 'chamado' || data.table == 'gmud') {
        leftJoin += `left join person on person.id_person = ${data.table}.id_solicitante `;

        aliasPerson = `, person.login as p_login, person.full_name as p_full_name, person.first_name as p_first_name, `;
        aliasPerson += `person.phone as p_phone, person.email as p_email, person.departamento as p_departamento, `;
        aliasPerson += `person.filial as p_filial`;
        oderBy = `ORDER BY num_${data.table} DESC`;
      };

      if (data.table == 'ticket') {
        fields += 'ticket.num_chamado,ticket.num_ticket,ticket.titulo,ticket.versao,ticket.id_fornecedor,';
        fields += 'ticket.versao_futura';
        aliasFornecedor = `, fornecedor.name,fornecedor.link_open_ticket,fornecedor.link_ticket`

        leftJoin += `left join fornecedor on fornecedor.id_fornecedor = ${data.table}.id_fornecedor `;
        oderBy = `ORDER BY num_ticket DESC`;
      };

      const alias = aliasPerson + aliasOperator + aliasFornecedor;

      let where = '';
      if (whereOpens !== '' && whereOptionals !== '') {
        where = `where ${whereOpens} and ${whereOptionals}`;
      }else if (whereOpens !== '') {
        where = `where ${whereOpens}`;
      }else if (whereOptionals !== '') {
        where = `where ${whereOptionals}`;
      };
      
      const query = `select ${fields}, ${toChar} ${alias} from ${data.table} ${leftJoin} ${where} ${oderBy}`;
      
      const allData = await this.client.query(query);

      return allData.rows;

    } catch (error) {
      this.erro_message = `Erro 019: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    } 
  },
  readLastActivity: async function () { 
    let query = `select * from last_activity`;
    try {
      const last_activity = await this.client.query(query);
      return last_activity.rows;

    } catch (error) {
      this.erro_message = `Erro 073: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };
  },
  getFornecedor: async function () { 
    try{
      const query = `select * from fornecedor;`;
      const allData = await this.client.query(query);
      return allData.rows;

    } catch (error) {
      this.erro_message = `Erro 060: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };
  },
  getUserLoggedData: async function (id_firebase){
    const firebaseData = await selectData('firebaseuser',['id_firebase'],[id_firebase]);
    const operatorData = await selectData('operator',['id_operator'],[firebaseData[0].id_operator]);
    return operatorData[0]
  },

  syncDataTopDesk: async function(operator_login, chamado){
    let data;
    var chamado_value = chamado;

    if (operator_login == 'automatic-sync') {
      //ler todos os chamados que estão abertos      
      data = {  
        table: 'chamado',
        closed: false, //false = somente status abertos
        /* whereTable: '',
        whereField: [],
        whereValue:  [], */
        sync: false,
      };
    }else if(chamado !== '0'){
      //ler somente num_chamado encaminhado  
      chamado_value = chamado.replace('+','/').trim();
      data = {
        table: 'chamado',
        closed: true,
        whereTable: 'chamado',
        whereField: ['num_chamado'],
        whereValue: [chamado_value]
      };
    }else{
      //ler todos os chamados que estão abertos para um determinado operador
      data = {  
        table: 'chamado',
        closed: false,  //false = somente status abertos
        whereTable: 'operator',
        whereField: ['operator.login'],
        whereValue:  [operator_login],
        sync: false,
      };
    };
    let resData = '', itarator = 0;
    try {
      resData = await this.readAllData(data);          

      const user = operator_login == 'automatic-sync' ? 'automatic-sync' : resData[0] ? resData[0].o_login : 'vazio';

      let message = chamado_value !== '0' ? chamado_value : user;
      let initialMessage = `iniciei sync - ${message}`;
      let finalMessage = `terminei sync - ${message}`;
      console.log(initialMessage);
      
      
      if (resData[0] == null) {
        this.erro_message = `Erro 097 - : ${chamado_value ? `Chamado ${chamado_value} não encontrado` : 'Nenhum dado encontrado'}`;
        console.log(this.erro_message);
        return this.erro_message;
      }else if (resData.indexOf('Erro') == 0) {
        return resData;
      }else{
        
        for (let i = 0; i < resData.length; i++) {
          itarator = i;
          //for para verificar se algum chamado do operador tem GMUD para ser atualizada
          
    //*============================================ GMUD ===============================================
          const resSelect = await selectData('gmud', ['num_chamado'],[resData[i].num_chamado]);
      
          if (resSelect.indexOf('Erro') == 0) {
            //se der erro no select, retorna o erro
            return resSelect;
          }else{
          //se não der erro, então verifico se pra algum chamado ele encontrou gmud
            if (resSelect !== '' && resSelect !== undefined && resSelect.length > 0) {
              for (let y = 0; y < resSelect.length; y++) {
                //se encontrou, eu vejo todas as mudanças para cada chamado
                const resMudanca = await topDeskAPI.buscaMudancaTopDesk(resSelect[y].num_gmud);
                
                let gmudData = await this.getTableFieldValue('gmud',resMudanca);
                gmudData['num_chamado'] = resSelect[y].num_chamado;
                
                //só passo o num_chamado aqui no update pois se tiver mais de um chamado com aquela gmud, altero pra todas
                const resUpdateGmud = await this.updateTable('gmud',
                ['status','dt_encerramento'], 
                [gmudData.status, gmudData.dt_encerramento], 
                ['num_chamado'], [gmudData.num_chamado]);

                if (resUpdateGmud !== true) {
                  //se der erro no update, retorna o erro
                  return resUpdateGmud;
                };
              };
            };
          };
    //*============================================ CHAMADO ===============================================
          let resChamado = '', activity = false;
          if (resData[i].num_chamado.trim().length == 14) {
            
            resChamado = await topDeskAPI.buscaChamadoTopDesk(resData[i].id_chamado.trim(),'id'); 
          }else if (resData[i].num_chamado.trim().length == 11) {
            resChamado = await topDeskAPI.buscaChamadoTopDesk(resData[i].num_chamado.trim(),'number');
          }else {
            resChamado = await topDeskAPI.buscaChamadoTopDesk(resData[i].id_chamado.trim(),'activity');
            activity = true;
          };
          if (resChamado == null || resChamado == undefined) {
            //verifiquei que eu tinha gravado um chamado que era de teste e ele foi deletado do top desk
            //portanto se aqui eu retorno null ele deve ter sido excluído no topdesk vou alterar o status e dar um contiue

            console.log(`Erro 062: Chamado ${resData[i].num_chamado} provavelmente excluído do TopDesk!`);

            const updateRemovido = await this.updateTable('chamado',['status',],['Removido'],['num_chamado'], [resData[i].num_chamado]);
            continue;
          }else if (resChamado == 524) {
            //524 - timeout
            this.erro_message = `Erro 104 - TopDesk Timeout!`;
            console.log(this.erro_message);
            return this.erro_message;
          };
          console.log('passei', resChamado);
          
          
          let chamadoData = '';
          if (activity) {
            chamadoData = await this.getTableFieldValue('activity',resChamado);
          }else{
            chamadoData = await this.getTableFieldValue('chamado',[resChamado]);
          };

          let diferente = false;

          if (chamadoData.feedback_rating !== null && chamadoData.feedback_rating !== undefined){
            if (resData[i].feedback_rating !== null && resData[i].feedback_rating !== undefined) {
              if (parseInt(resData[i].feedback_rating.trim()) !== chamadoData.feedback_rating) {
                diferente = true;
              };
            }else {
              //se o primeiro if é diferente de null e o segundo não, então é diferente
              diferente = true;
            };
          };

          if (chamadoData.feedback_message !== null && chamadoData.feedback_message !== undefined){
            if (resData[i].feedback_message !== null && resData[i].feedback_message !== undefined) {
              if (resData[i].feedback_message.trim() !== chamadoData.feedback_message.trim()) {
                diferente = true;
              };
            }else {
              //se o primeiro if é diferente de null e o segundo não, então é diferente
              diferente = true;
            };
          };

          //checar se existe incidente parcial e mandar criar
          const partials = chamadoData.partialIncidents
          if (partials) {
            for (let i = 0; i < partials.length; i++) {
              const resTopdesk = await topDeskAPI.buscaChamadoTopDesk(resData[i].num_chamado,partials[i].link); 
              //se achei chamado parcial nesse que estou sincronizando, vou mandar criar ele no getTableFieldValue
              let chamadoPartialData = await this.getTableFieldValue('chamado',[resTopdesk],true);
            };
          };
          
          const incidente = await this.alteraChamadoDiferenteTopdeskDB(resData[i],chamadoData,diferente);
          if (incidente !== true) {
            continue;
          };
        };

        console.log(finalMessage);
        
        //se tudo der certo acima, ele vai cair nesse return e retorno true
        return true;
      };
    } catch (error) {
      this.erro_message = `Erro 053 - ${resData[itarator] ? resData[itarator].num_chamado : 'vazio'} : ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };
  },

  //*===========================================CREATE=========================================
  createChamadoTopdesk: async function(table, fieldValue) {
    //esse cara está apartado do createData porque ele fica lendo toda hora a API do
    //topdesk e deixando esse cara apartado eu evito conflito de espera caso crie
    //um outro registro além do chamado do topdesk

    delete fieldValue.partialIncidents; //não crio esse campo no DB

    const resReadObject = await insertObjectToValue(fieldValue);    

    const fieldsObject = resReadObject.field;
    const valuesObject = resReadObject.value;

    let query = `INSERT INTO ${table} ${fieldsObject} ${valuesObject};`

    //TO CREATE CHAMADO
    if (table == 'chamado') {      
      if (!await existePostgreSql(table, ['num_chamado'],[fieldValue.num_chamado])) {   
        try {
          const resultCreateData = await client.query(query);
        } catch (error) {
          this.erro_message = `Erro 021 - ${fieldValue.num_chamado} - ${error}`;
          console.log(this.erro_message);
          return this.erro_message;
        };
      } else{       
        //this return false, stop the for if exists the call 
        return false;
      }
    };
    
    return true;
  },
  createData: async function(table, fieldValue) {
    delete fieldValue.incluiTextoChamado;
    delete fieldValue.incluiTextoChamadoInvisivel;
    delete fieldValue.nome_solicitante;
    delete fieldValue.id_chamado;
    //os campos acima são usados apenas para o envio de dados para o topdesk

    const resReadObject = await insertObjectToValue(fieldValue);

    const fieldsObject = resReadObject.field;
    const valuesObject = resReadObject.value;
    
    let query = `INSERT INTO ${table} ${fieldsObject} ${valuesObject};`
    
    if (table == 'ticket') {
      if (fieldValue.status == 'Fechado' && (fieldValue.dt_encerramento == null || fieldValue.dt_encerramento == undefined )) {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;
        fieldValue.dt_encerramento = today
      }
      if (!await existePostgreSql(table, ['num_ticket','id_fornecedor','num_chamado'],[fieldValue.num_ticket,fieldValue.id_fornecedor,fieldValue.num_chamado])) {   
        try {
          const resultUpdateChamado = await this.updateTable('chamado',['fornecedor'],['true'],['num_chamado'],[fieldValue.num_chamado]);
          if (resultUpdateChamado == true) {
            try {
              //criar chamado
              const resultCreateData = await client.query(query);
            } catch (err) {
              this.erro_message = `Erro 018: ${err}`;
              return this.erro_message;
            }
          } else { //se não conseguir atualizar o chamado
            this.erro_message = `Erro 023: num_chamado ${fieldValue.num_chamado} não encontrado, favor verificar`;
            console.log(this.erro_message);
            return this.erro_message;
          };
          
        } catch (error) {
          this.erro_message = `Erro 014: ${error}`;
          console.log(this.erro_message);
          return this.erro_message;
        }
      } else {
        this.erro_message = `Alerta 001: O ticket ${fieldValue.num_ticket} já existe para esse chamado ${fieldValue.num_chamado}.`;
        //console.log(this.erro_message);
        return this.erro_message;
      };
    };
   
    //TO CREATE GMUD
    if (table == 'gmud') {
      if (!await existePostgreSql(table, ['num_gmud','num_chamado'],[fieldValue.num_gmud,fieldValue.num_chamado])) {
        //create person
        try {
          const resultCreatePerson = await createPessoa('person',fieldValue.id_solicitante);
        } catch (err) {
          this.erro_message = `Erro 015: ${err}`;
          console.log(this.erro_message);
          return this.erro_message;
        }

        try {
          const resultUpdateChamado = await this.updateTable('chamado',['gmud'],['true'],['num_chamado'],[fieldValue.num_chamado]);
          if (resultUpdateChamado == true) {
            try {
              //criar gmud
              const resultCreateData = await client.query(query);
            } catch (err) {
              this.erro_message = `Erro 016: ${err}`;
              console.log(this.erro_message);
              return this.erro_message;
            }
          } else { //se não conseguir atualizar o chamado
            this.erro_message = `Erro 017: num_chamado ${fieldValue.num_chamado} não encontrado, favor verificar`;
            console.log(this.erro_message);
            return this.erro_message;
          };
          
        } catch (err) {
          this.erro_message = `Erro 013: ${err}`;
          console.log(this.erro_message);
          return this.erro_message;
        }
      } else {
        this.erro_message = `Alerta 002: A mudança ${fieldValue.num_gmud} já existe para esse chamado ${fieldValue.num_chamado}.`;
        return this.erro_message;
      }    
    };
        
    return true;
  },
  createFirebaseUser: async function (id_firebase,login) {
    //não precisaria checar pois o firebase faz essa checagem, mas estou checando por preucação
    const resUserSelect = await selectData('operator',['login'],[login]);
    let params = '';
    
    //checar se retornou valor no resUserSelect
    if (resUserSelect[0] !== null && resUserSelect[0] !== undefined && resUserSelect[0] !== []) {
      //se entrei aqui, então achei um operador no db

      params = `(id_firebase,login, id_operator) values('${id_firebase}','${login}','${resUserSelect[0].id_operator}')`;
    }else{
      params = `(id_firebase,login) values('${id_firebase}','${login}')`;
    };
    let query = `insert into firebaseuser ${params}`;
    try {
      const resCreateUser = await client.query(query);
      //if rowCount = 1 then we had success
      if (resCreateUser.rowCount == 1 || resCreateUser.rowCount == '1') {
        return true;
      }else{
        return false;
      };

    } catch (error) {
      this.erro_message = `Erro 045: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };

  },
  createFolder: async function (chamadoNumber) {
    try {
      const resSelectParameters = await selectData('parameters');
      const path = resSelectParameters[0].folder_path.trim();
      try {
        const chamado_value = chamadoNumber.replace('+','/');
        const resSelectChamado = await selectData('chamado',['num_chamado'],[chamado_value]);

        const chamado_path = chamadoNumber.replace('+','-');
        const title = await removeSpecialCharacters(resSelectChamado[0].titulo);
        const full_path = `${path}${chamado_path} - ${title}`;

        return full_path;
        
      } catch (error) {
        this.erro_message = `Erro 009: ${error}`;
        console.log(this.erro_message);
        return this.erro_message;
      }
      
    } catch (error) {
      this.erro_message = `Erro 008: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    }
    
  },
  insertActivityValue: async function (activity, change) {  
    let query = `insert into last_activity (num_activity,num_change) values('${activity}','${change}')`;
    try {
      await this.client.query(query);
    } catch (error) {
      this.erro_message = `Erro 076: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };
  },

//*===========================================UPDATE=========================================
  updateTable: async function(table, fields, values, whereField, whereValue) {
    /*example to call this function: 
      updateTable('chamado', ["test1","test2","test3"], ["val1","val2","val3"], 'num_chamado', 'I1903-00050')
    */
    //tive que mover essa updateTable para ser local e usar em outros lugares aqui nesse arquivo
    const update = await localUpdateTable(table, fields, values, whereField, whereValue);
    return update;
  },
  updateActivityValue: async function (activity, change) {
    let query = `update last_activity set num_activity = '${activity}', num_change = '${change}'`;
    try {
      await this.client.query(query);
    } catch (error) {
      this.erro_message = `Erro 075: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };
  },
//*===========================================DELETE=========================================
  deleteGmud: async function(gmud_number, chamado_number) {
    try {
      const query = `delete from gmud where num_gmud = '${gmud_number}' and num_chamado = '${chamado_number}';`;
      const resultDeleteGumd = await client.query(query);
      
      //dps de ter deletado a gmud em cima, vou checar se existe ainda alguma gmud para o num_chamado recebido
      if (!await existePostgreSql('gmud',['num_chamado'],[chamado_number])) {
        //se retornou false, é pq não existe nenhuma gmud para o chamado passado, portanto, vou alterar esse chamado na table chamado
        try {
          await this.updateTable(
            'chamado',
            ['gmud'],
            ['false'],
            ['num_chamado'],
            [chamado_number]
          );
        } catch (error) {
          this.erro_message = `Erro 024: ${error}`;
          console.log(this.erro_message);
          return this.erro_message;
        }
      }
      return true;
    } catch (err) {
      this.erro_message = `Erro 025: ${err}`;
      console.log(this.erro_message);
      return this.erro_message;
    }
  },
  deleteTicket: async function(ticket) {

    const part1 = `delete from ticket where num_ticket = '${ticket.num_ticket}' `;
    const part2 = `and num_chamado = '${ticket.num_chamado}' and id_fornecedor = '${ticket.id_fornecedor}'`;
    let query = part1 + part2;

    try {
      const resultDeleteTicket = await client.query(query);

      if (!await existePostgreSql('ticket',
        ['num_chamado'],[ticket.num_chamado])) {
        //se retornou false, é pq não existe nenhum outro ticket para o chamado passado, portanto, vou alterar esse chamado na table chamado
        try {          
          await this.updateTable(
            'chamado',
            ['fornecedor'],
            ['false'],
            ['num_chamado'],
            [ticket.num_chamado]
          );
        } catch (error) {
          this.erro_message = `Erro 026: ${error}`;
          console.log(this.erro_message);
          return this.erro_message;
        };
      };
      return true;
    } catch (error) {
      this.erro_message = `Erro 027: ${error}`;
      console.log(this.erro_message);
      return this.erro_message;
    };
    
  } 
};
