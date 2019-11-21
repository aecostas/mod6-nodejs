const axios = require('axios');

const axiosCacheAdapter = require('axios-cache-adapter');
const config = require('config')

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
    label({ label: 'main' }),    timestamp(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
    new transports.Console()
  ]
});

const api = axiosCacheAdapter.setup({
   // `axios-cache-adapter` options
  cache: {
    maxAge: 0.5 * 60 * 1000
  }
})

const app = express();

app.get('/beaches', async (req, res) => {
  const year = req.query['year'];
  
  if (year === undefined) {
    res.status(400).send('Faltan parametros');
    return;
  }

  if (!config.has(`resources.${year}`)) {
    res.status(404).send('No hay datos de ese año');
    return;
  }

  const url = config.get(`resources.${year}`);
  const response = await api.get(url);

  logger.debug(`Received message from external server (cached: ${response.request.fromCache === true})`);

  parse(response.data, {
    trim: true,
    skip_empty_lines: true,
    delimiter:';',
    columns: true
  },
  function(err, result) {
    const state = req.query['state']; 

    if (state !== undefined) {
      const filteredData = result.filter( item => item['C�DIGO PROVINCIA'] === state);

      if (filteredData.length === 0) {
        res.status(404).send('No hay datos');
      } else {
        res.send(filteredData);
      }
    } else {
      res.send(result);
    }
    
  })

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

const port = config.get('server.port');

app.listen(port, function () {
  logger.info(`Starting points of interest application listening on port ${port}`);
});

