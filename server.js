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
const csvToObject = (data, delimiter) => {
  return new Promise((resolve, reject) => {
    parse(data, {
      trim: true,
      skip_empty_lines: true,
      delimiter: delimiter,
      columns: true
    },
    function(err, result) {
      resolve(result);
    });

  })
}

app.get('/theater', async (req, res) => {
  const url = config.get(`resources.theater`);
  const response =  await api.get(url);
  const result = await csvToObject(response.data, ';')

  const transformedResult = result.map( item => {
    const newObj = {};

    newObj['concello'] = item['CONCELLO'];
    newObj['provincia'] = item['PROVINCIA'];
    newObj['coordenadas'] = item['COORDENADAS'];
    newObj['web'] = item['WEB'];
    newObj['nome'] = item['ESPAZO'];
    newObj['data'] = {
      aforamento: item['AFORAMENTO']
    };

    return newObj;
  });

  res.send(transformedResult);
});

app.get('/council', async (req, res) => {
  const url = config.get(`resources.council`);
  const response = await api.get(url);
  const result = await csvToObject(response.data, ',')

  const transformedResult = result.map( item => {
    const newObj = {};

    newObj['concello'] = item['CONCELLO'];
    newObj['provincia'] = item['PROVINCIA'];
    newObj['coordenadas'] = `${item['LATITUD']}, ${item['LONGITUD']}`;
    newObj['web'] = item['PORTAL WEB'];
    newObj['nome'] = item['CONCELLO'];
    newObj['data'] = {};

    return newObj;
  });

  res.send(transformedResult);

})


app.get('/beaches', async (req, res) => {
  const year = req.query['year'];
  
  if (year === undefined) {
    res.status(400).send('Faltan parametros');
    return;
  }

  if (!config.has(`resources.beaches.${year}`)) {
    res.status(404).send('No hay datos de ese año');
    return;
  }

  const url = config.get(`resources.beaches.${year}`);
  const response = await api.get(url);

  logger.debug(`Received message from external server (cached: ${response.request.fromCache === true})`);

  let filteredData = await csvToObject(response.data, ';')

  const state = req.query['state'];

  if (state !== undefined) {
    filteredData = filteredData.filter(item => item['C�DIGO PROVINCIA'] === state);
  }
  
  if (filteredData.length === 0) {
    res.status(404).send('No hay datos');
    return;
  } 

  const transformedResult = filteredData.map( item => {
    const newObj = {};

    newObj['concello'] = item['CONCELLO'];
    newObj['provincia'] = item['PROVINCIA'];
    newObj['coordenadas'] = item['COORDENADAS'];
    newObj['web'] = item['M�IS INFORMACI�N EN TURGALICIA'];
    newObj['nome'] = item['PRAIA'];
    newObj['data'] = {};
    newObj['data']['tipo'] =  item['TIPO'],
    newObj['data']['tipoArea'] = item['TIPO DE AREA'],
    newObj['data']['lonxitude'] = item['LONXITUDE']

    return newObj;
  });

  res.send(transformedResult);

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

