
const axios = require('axios');


axios.get('http://localhost:3000/beaches').then((response) => {
    console.log(response)
})