const parse = require('csv-parse');

const csvToObject = (data, delimiter) => {
    return new Promise((resolve, reject) => {
        parse(data, {
            trim: true,
            skip_empty_lines: true,
            delimiter: delimiter,
            columns: true
        },
            function (err, result) {
                resolve(result);
            });

    })
}

const transformToCommonFormat = (item) => {
    let output = {};

    output['concello'] = item['CONCELLO'];
    output['provincia'] = item['PROVINCIA'];
    output['web'] = item['PORTAL WEB'] || item['WEB'] || item['M�IS INFORMACI�N EN TURGALICIA'];
    output['nome'] = item['PRAIA'] || item['ESPAZO'] || item['CONCELLO'];
    output['coordenadas'] = item['COORDENADAS'] || `${item['LATITUD']}, ${item['LONGITUD']}`

    output.data = {};

    if (item['PRAIA'] !== undefined) {

        output['data']['tipoArea'] = item['TIPO DE AREA'];
        output['data']['lonxitude'] = item['LONXITUDE'];

    } else if (item['AFORAMENTO'] !== undefined) {
        output['data']['aforamento'] = item['AFORAMENTO'];

    }

    return output;
}

module.exports = {
    transformCSV: csvToObject,
    transformObject: transformToCommonFormat
}