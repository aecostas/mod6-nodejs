const axios = require('axios');
const parse = require('csv-parse');
const winston = require('winston');

const url = 'https://abertos.xunta.gal/catalogo/cultura-ocio-deporte/-/dataset/0401/praias-galegas-con-bandeira-azul-2019/001/descarga-directa-ficheiro.csv';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({format: winston.format.simple()})
  ]
});

logger.log({
  level: 'info',
  message: 'Starting points of interest application!'
});

logger.log({
  level: 'debug',
  message: 'debugging message'
});

axios.get(url).then( (response) => {

  parse(response.data, {
    trim: true,
    skip_empty_lines: true,
    delimiter:';',
    columns: true
  },
  function(err, result) {
    console.log(result.length);
  })

});





