const express = require("express");
var bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


const users = require('./api/users');
app.use('/api/users', users);

const chamados = require('./api/chamados');
app.use('/api/chamados', chamados);

const gmuds = require('./api/gmud');
app.use('/api/gmuds', gmuds);

const tickets = require('./api/tickets');
app.use('/api/tickets', tickets);

const fornecedor = require('./api/fornecedor');
app.use('/api/fornecedor', fornecedor);


const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static('public'));

app.listen(port, () => console.log(`Web server is listening.. on port ${port}`));


