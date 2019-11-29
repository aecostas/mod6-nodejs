const axios = require('axios');

const axiosCacheAdapter = require('axios-cache-adapter');
const config = require('config')

const express = require('express');
const bodyParser = require('body-parser');

const utils = require('./utils');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
let id = 0;
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


let poiMap = {
  theater: [],
  beaches: [],
  council: []
}


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

const domainCors = config.get('domainCors');
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", domainCors.join(','));
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/poi', (req, res) => {
  res.send(Object.keys(poiMap));
});

app.get('/poi/theater', async (req, res) => {
  const url = config.get(`resources.theater`);
  const response =  await api.get(url);
  const result = await utils.transformCSV(response.data, ';')

  const transformedResult = result.map( utils.transformObject );


  res.send(transformedResult);
});

app.get('/poi/council', async (req, res) => {
  const url = config.get(`resources.council`);
  const response = await api.get(url);
  const result = await utils.transformCSV(response.data, ',')

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


app.get('/poi/beaches', async (req, res) => {
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

  let filteredData = await utils.transformCSV(response.data, ';')

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

app.post('/poi', (req, res) => {
  let name = req.body['name'];

  if (name === undefined) {
    res.status(400).send();
    return;
  }

  name = name.trim()

  if (name.length === 0) {
    res.status(400).send();
    return;
  }

  if (poiMap[name] !== undefined) {
    res.status(409).send();
    return;
  }

  poiMap[name] = [];
  
  res.send();
})

app.post('/poi/:collection', (req, res) => {
  const collection = req.params['collection'];

  if (poiMap[collection] === undefined) {
    res.status(404).send();
    return
  }

  if (collection ==='beaches' || collection ==='theater' || collection ==='council') {
    res.status(405).send();
    return
  }
  
  const concello = req.body['concello'];
  const provincia = req.body['provincia'];
  const web = req.body['web'];
  const nome = req.body['nome'];
  const coordenadas = req.body['coordenadas'];

  let poiData = {};

  poiData['concello'] = concello;
  poiData['provincia'] = provincia;
  poiData['web'] = web;
  poiData['nome'] = nome;
  poiData['coordenadas'] = coordenadas;

  for (let value of Object.values(poiData)) {
    if (value === undefined || value.trim().length === 0) {
      res.status(400).send();
      return
    }
  }

  poiData['id'] = id;

  poiData.data = {};

  for (let key of Object.keys(req.body)) {
    if (poiData[key] === undefined) {
      const value = req.body[key].trim();

      if (value.length === 0) {
        res.status(400).send();
        return;
      }

      poiData.data[key] = value;
    }
  }


  poiMap[collection].push(poiData);
  
  id++;
  
  res.send(poiData.id.toString());

  
})

app.get('/poi/:collection', (req, res) => {
  const collection = req.params['collection'];

  if (poiMap[collection] === undefined) {
    res.status(404).send();
    return;
  }
  res.send(poiMap[req.params.collection]);
});

app.patch('/poi/:collection/:id', (req, res) => {
  const collection = req.params['collection'];
  const id = req.params['id'];
  const bodyParams = req.body;

  if (poiMap[collection] === undefined) {
    res.status(404).send();
    return;
  }

  let index = poiMap[collection].findIndex(item => item.id == id);

  if (index === -1) {
    res.status(404).send();
    return;
  }
  for (let param in Object.keys(bodyParams)) {
    if(param === 'id' || param === 'data') {
      continue;
    }

    if (poiMap[collection][index][param] !== undefined) {
      poiMap[collection][index][param] = bodyParams[param];
    } else {
      poiMap[collection][index]['data'][param] = bodyParams[param];
    }
  }

  res.send();
});

app.delete ('/poi/:collection/:id', (req, res) => {
  let id = req.body['id'];


});


const port = config.get('server.port');

app.listen(port, function () {
  logger.info(`Starting points of interest application listening on port ${port}`);
});

