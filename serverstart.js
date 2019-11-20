//arquivo usado para subir corretamente no servidor
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.resolve((__dirname ,'./dist'))));

app.all('*',(req,res)=>{
    res.sendFile(path.resolve(__dirname,'./dist/index.html'))
})
app.listen(8080, () => {
    console.log('Servidor Rodando na porta 8080!');
});

//Run app, then load http://localhost:port in a browser to see the output.
