const express = require('express');
const router = express.Router();

/*
    https://gist.github.com/kdzwinel/8235348
*/
function calculateTrilateration(x1, y1, x2, y2, x3, y3, r1, r2, r3) {
    const S = (Math.pow(x3, 2.) - Math.pow(x2, 2.) + Math.pow(y3, 2.) - Math.pow(y2, 2.) + Math.pow(r2, 2.) - Math.pow(r3, 2.)) / 2.0;
    const T = (Math.pow(x1, 2.) - Math.pow(x2, 2.) + Math.pow(y1, 2.) - Math.pow(y2, 2.) + Math.pow(r2, 2.) - Math.pow(r1, 2.)) / 2.0;
    const y = ((T * (x2 - x3)) - (S * (x2 - x1))) / (((y1 - y2) * (x2 - x3)) - ((y3 - y2) * (x2 - x1)));
    const x = ((y * (y1 - y2)) - T) / (x2 - x1);

    return { x, y };
}

function getLocations(distances) {
    // validar array floats
    /* 1: kenobi, 2: skywalker, 3: sato */
    const x1 = parseFloat(process.env.KENOBI_X);
    const y1 = parseFloat(process.env.KENOBI_Y);
    const x2 = parseFloat(process.env.SKYWALKER_X);
    const y2 = parseFloat(process.env.SKYWALKER_Y);
    const x3 = parseFloat(process.env.SATO_X);
    const y3 = parseFloat(process.env.SATO_Y);
    const r1 = parseFloat(distances[0]);
    const r2 = parseFloat(distances[1] ? distances[1] : 0);
    const r3 = parseFloat(distances[2] ? distances[2] : 0);

    return calculateTrilateration(x1, y1, x2, y2, x3, y3, r1, r2, r3);
}

function getMessage(messages) {
    // validar array strings
    let tempWords = [];
    let words = [];

    messages.forEach(message => {
        message.forEach((word,index) => {
            if(word === '')
                return;

            if(tempWords.filter(tempWord => tempWord.word === word).length < 1) { // si no está en el arreglo -words- agregar palabra con la posicion
                tempWords.push({word: word, position: index});
            }
        });
    });

    tempWords = tempWords.sort((a, b) => Number(a.position) - Number(b.position)); // ordenar según la posicion
    words = tempWords.map(words => words.word);

    const message = words.join(" ");
    return message;
}

router.post('/topsecret', (req, res) => {
    let r1, r2, r3;
    let error = false;

    const satellites = req.body.satellites;
    satellites.forEach(sat => {
        switch (sat.name.toLowerCase()) {
            case 'kenobi':
                r1 = sat.distance;
                break;
            case 'skywalker':
                r2 = sat.distance;
                break;
            case 'sato':
                r3 = sat.distance;
                break;
            default:
                error = true;
                break;
        }
    });

    const distances = [r1, r2, r3];
    
    /* get messages from body */
    const messages = satellites.map(sat => sat.message);
    const { x, y } = getLocations(distances);
    const message = getMessage(messages);

    if(isNaN(x) || isNaN(y)){
        error = true;
    }

    if(error){
        res.status(404).json({error: "Non processable"});
        return;
    }
    
    res.status(200).json({
        position: {
            x: x,
            y: y
        },
        message: message
    });
    
});

module.exports = router;