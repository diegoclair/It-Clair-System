//import axios from 'axios';
import axios from 'axios'

//prototipo
const urlChamados = 'http://localhost:3000/api/chamados'; //os dados são enviados para o arquivo chamados.js
const urlGmuds = 'http://localhost:3000/api/gmuds';       //os dados são enviados para o arquivo gmud.js
const urlTickets = 'http://localhost:3000/api/tickets'; //os dados são enviados para o arquivo tickets.js
const urlUser = 'http://localhost:3000/api/users'; 
const urlFornecedor = 'http://localhost:3000/api/fornecedor';

//producao
/*const urlChamados = 'http://itclair.tech:3000/api/chamados'; //os dados são enviados para o arquivo chamados.js
const urlGmuds = 'http://itclair.tech:3000/api/gmuds';       //os dados são enviados para o arquivo gmud.js
const urlTickets = 'http://itclair.tech:3000/api/tickets'; //os dados são enviados para o arquivo tickets.js
const urlUser = 'http://itclair.tech:3000/api/users';
const urlFornecedor = 'http://itclair.tech:3000/api/fornecedor';*/

class ChamadosService{
    //*==================================================GET===============================================================//
    // Get dATA from postgresql
    static getData(entryData, clearStorage) {
        
        return new Promise (async (resolve, reject) => {
            let res = '';
            let resData = '';
            try {
                if (clearStorage) {
                    //remove all itens with data
                    localStorage.removeItem(`chamados-${entryData.whereValue}`);
                };
                if (entryData.table == 'chamado') {
                    //tive que usar post no lugar de get para passar objeto
                    if (localStorage.getItem(`chamados-${entryData.whereValue}`) !== null 
                     && localStorage.getItem(`chamados-${entryData.whereValue}`) !== undefined) {
                        res = JSON.parse(localStorage.getItem(`chamados-${entryData.whereValue}`));
                        //coloquei esse resolve aqui pq no local storage já salvo o res.data

                        if (res.indexOf('Erro') == 0 || res.indexOf('Alerta') == 0) {
                            this.erro_message = `${res}`;
                            console.log(this.erro_message);
                            reject(res);
                            return this.erro_message;
                        }else{
                            resolve(
                                res.map(data => ({
                                    ...data
                                }))
                            );
                        }
                        
                    }else{
                        res = await axios.post(`${urlChamados}/`, {
                            entryData
                        });
                        localStorage.setItem(`chamados-${entryData.whereValue}`, JSON.stringify(res.data));
                    };
                } else if (entryData.table == 'gmud') {
                    res = await axios.get(`${urlGmuds}/`);
                } else if (entryData.table == 'ticket') {
                    res = await axios.get(`${urlTickets}/`); 
                } else if (entryData.table == 'fornecedor') {
                    res = await axios.get(`${urlFornecedor}/`);
                };
                
                resData = res.data;
                if (resData.indexOf('Erro') == 0 || resData.indexOf('Alerta') == 0) {
                    this.erro_message = `${resData}`;
                    console.log(this.erro_message);
                    reject(resData);
                    return this.erro_message;
                };
                //aqui nós tentamos e se der certo, chamamos o resolve, se der errado, no catch, chamamos o reject                
                resolve(
                    resData.map(data => ({
                        ...data
                    }))
                );
            } catch (error) {                
                /* if (resData.indexOf('Erro ') == 0 || resData.indexOf('Alerta ') == 0) {
                    reject(resData);
                } */
                reject(`Erro 066 - ${error}`);
            };
       }); 
    };
    static getUserData(id){
        return new Promise (async (resolve, reject) => {
            let res = '';
            let resData = [];
            try {
                res = await axios.get(`${urlUser}/logged/${id}`);           
                resData.push(res.data);
                
                //aqui nós tentamos e se der certo, chamamos o resolve, se der errado, no catch, chamamos o reject
                resolve(resData);

            } catch (error) {
                reject(`Erro 067 - ${error}`);
            };
       }); 
    };
    //ESSE NÃO ESTÁ SENDO CHAMADO get data from a only one chamado
    static syncDataTopDesk(login_operator, chamado) {
                
        return new Promise (async (resolve, reject) => {
            let res = '';
            let resData = [];
            const chamado_value = chamado.replace('/','+');
            
            try {
                res = await axios.get(`${urlChamados}/topdesk/${login_operator}/${chamado_value}`);           
                resData.push(res.data);
                
                //aqui nós tentamos e se der certo, chamamos o resolve, se der errado, no catch, chamamos o reject
                resolve(resData);

            } catch (error) {
                reject(`Erro 068 - ${error}`);
            };
       }); 
    };

    //*==================================================POST===============================================================//
    static async createFirebaseUser(id_firebase, login){
        const res = await axios.post(`${urlUser}/firebaseUser/${id_firebase}/${login}`);        
        return res.data;
    };
    static async createTicket(ticket){
        const res = await axios.post(`${urlTickets}/newTicket`, {
            ticket
        });
        return res.data;        
    };
    
    static async createFolder(chamadoNumber){
        const res = await axios.post(`${urlChamados}/folder/${chamadoNumber}`);
        return res.data;
    };
    static async createGmud(gmudNumber, chamadoNumber){
        const resultCreateGmud = await axios.post(`${urlGmuds}/${gmudNumber}/${chamadoNumber}`);
        const res = resultCreateGmud.data
        
        //se retornar um objeto com os dados da gmud, significa que deu certo
        if (typeof res === 'object') {
            return true;
        } else{
            //se não retornou um object, então provavelmente retornará uma string com erro, vou então retornar essa string
            return res;
        }
    };
    
    // Create Chamado - não está sendo utilizado, pois pego direto do top desk
    static async insertChamado(id_chamado,dt_abertura, status, topdesk_link, num_chamado, solicitante, departamento, modulo, titulo) {
        return await axios.post(urlChamados, {
            //quando meus parametro sao iguais, nao preciso repetir na frente como aqui no primeiro
            id_chamado: id_chamado,
            dt_abertura,
            status,
            topdesk_link,
            num_chamado,
            solicitante,
            departamento,
            modulo,
            titulo
        });
    };
    
    //*=================================================DELETE===============================================================//
    static async deleteGmud(gmudNumber, chamadoNumber){
        const resultCreateGmud = await axios.delete(`${urlGmuds}/${gmudNumber}/${chamadoNumber}`);
        const res = resultCreateGmud.data
        return res;
    };
    static async deleteTicket(ticket){

        const num_chamado = ticket.num_chamado;
        const num_ticket = ticket.num_ticket;
        const id_fornecedor = ticket.id_fornecedor;
        const urlComplement = `delete/${num_chamado}/${num_ticket}/${id_fornecedor}`;

        const res = await axios.delete(`${urlTickets}/${urlComplement}`);
        return res.data;
    };
    
    //Delete Chamado  - não está sendo utilizado, pois eu nao deleto chamado do topdesk
    static async deleteChamado(chamadoNumber){
        return await axios.delete(`${urlChamados}/${chamadoNumber}`);
    };

    //*===================================================PUT===============================================================//
    static async updateStatus(dataUpdate){
        return await axios.put(`${urlChamados}/updateStatus`,{
            dataUpdate
        });
    };
    //Update Status chamado
    static async updateStatusTicket(ticket){
        
        return await axios.put(`${urlTickets}/updateStatus`,{
            ticket
        });
    };


}

export default ChamadosService;