const assert = require('assert');
const utils = require('../utils');


describe('Utils', () => {
    it('Should convert data with `portal web`', () => {
        const input = {
            'CONCELLO': 'nigran',
            'PROVINCIA': 'PONTEVEDRA',
            'PORTAL WEB': 'A.COM',
            'COORDENADAS': '1,2'
        }

        const outputOK = {
            'concello': 'nigran',
            'provincia': 'PONTEVEDRA',
            'web': 'A.COM',
            'coordenadas': '1,2',
            'nome': 'nigran'
        }

        const output = utils.transformObject(input);

        assert.equal( outputOK.concello , output.concello);
        assert.equal( outputOK.provincia , output.provincia);
        assert.equal( outputOK.web , output.web);
        assert.equal( outputOK.coordenadas , output.coordenadas);
        assert.equal( outputOK.nome , output.nome);

    });
});