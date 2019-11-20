const express = require("express");
var bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

const topDesk = require('./api/topdesk');
app.use('/api/topdesk', topDesk);

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static('public'));

app.listen(port, () => console.log(`Web server is listening.. on port ${port}`));


