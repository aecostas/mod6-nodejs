const axios = require('axios');

const axiosCacheAdapter = require('axios-cache-adapter');

// axiosCacheAdapter.setup

const express = require('express');
const parse = require('csv-parse');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const url = 'https://abertos.xunta.gal/catalogo/cultura-ocio-deporte/-/dataset/0401/praias-galegas-con-bandeira-azul-2019/001/descarga-directa-ficheiro.csv';

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: 'debug',
  format:  combine(
    label({ label: 'main' }),
    timestamp(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
    new transports.Console()
  ]
});

const app = express();
let lastUpdated = 0;
let beaches = [];

app.get('/beaches', async (req, res) => {
  let currentDate = new Date();

  if (currentDate - lastUpdated > 10000) {
    lastUpdated = currentDate;

    const response = await axios.get(url);
  
    logger.log({
      level: 'debug',
      message: 'Received message from external server'
    });

    parse(response.data, {
      trim: true,
      skip_empty_lines: true,
      delimiter:';',
      columns: true
    },
    function(err, result) {
      beaches = result;
      res.send(result)
    })

  } else {
    res.send(beaches);
  }

});

app.get('/students/', function (req, res) {
  res.send('<html><head></header><body><b>hola estduiante!</b></body></html>');
});

app.get('/', function (req, res) {
  const state = req.query['state'];

  logger.log({
    level:'debug',
    message: JSON.stringify(req.query)
  });


  if (state === undefined) {
    res.status(400).send('Falta un parámetro!!!!');
  } else if (state.toLowerCase() == 'pontevedra') {
    res.send('Estas en Pontevedra');
  } else {
    res.send('NO ESTÁS EN PONTEVEDRA');
  }

});



logger.log({
  level: 'info',
  message: 'Starting points of interest application!'
});

logger.log({
  level: 'debug',
  message: 'debugging message'
});



app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

