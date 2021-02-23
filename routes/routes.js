const express = require('express');
const router = express.Router();
const redis = require('redis');
const bluebird = require('bluebird');
const trilateration = require('node-trilateration');

// redis
const REDISHOST = process.env.REDISHOST;
const REDISPORT = process.env.REDISPORT;

const redisClient = redis.createClient(REDISPORT, REDISHOST);
redisClient.on('error', (err) => console.error('REDIS ERROR: ', err));

// enable async get for redis
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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

    const positions = [
        {x: x1, y: y1, distance: r1},
        {x: x2, y: y2, distance: r2},
        {x: x3, y: y3, distance: r3}
    ];

    const position = trilateration.calculate(positions);
    const x = position.x;
    const y = position.y;

    return {x, y};
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

    const message = words.join(' ');
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
        res.status(404).json({error: 'Non processable'});
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

router.post('/topsecret_split/:satellite', async (req, res) => {
    const satelliteNames = ['kenobi','skywalker','sato'];
    const {satellite} = req.params;
    let names = [];
    let allNames = '';

    if(!satelliteNames.includes(satellite.toLowerCase())){
        res.sendStatus(400);
        return;
    }

    let distanceKey = `${satellite.toLowerCase()}Distance`;
    let messageKey = `${satellite.toLowerCase()}Message`;
    let transformedMessage = req.body.message.join('-'); // de array a string separado con guion

    redisClient.get('satellites', (err, value) => {
        if(value === null){
            redisClient.set('satellites', satellite, redis.print);
            return;
        }
        
        names = value.split('-');
        if(!names.includes(satellite)){
            names.push(satellite);
            allNames = names.join('-');
            redisClient.set('satellites', allNames, redis.print);
        }
    });

    redisClient.set(distanceKey, req.body.distance, redis.print);
    redisClient.set(messageKey, transformedMessage, redis.print);

    res.sendStatus(204);
}); 

router.get('/topsecret_split', (req, res) => {
    redisClient.get('satellites', async (err, value) => {
        let sats = value ? value.split('-') : [];

        if(sats.length !== 3){
            res.status(400).json({message: 'Not enough information.'});
            return;
        }

        let kenobiDistance = await redisClient.getAsync('kenobiDistance');
        let skywalkerDistance = await redisClient.getAsync('skywalkerDistance');
        let satoDistance = await redisClient.getAsync('satoDistance');
        const distances = [kenobiDistance, skywalkerDistance, satoDistance];
        const {x,y} = getLocations(distances);

        let kenobiMessage = await redisClient.getAsync('kenobiMessage');
        let skywalkerMessage = await redisClient.getAsync('skywalkerMessage');
        let satoMessage = await redisClient.getAsync('satoMessage');

        kenobiMessage = kenobiMessage.split('-');
        skywalkerMessage = skywalkerMessage.split('-');
        satoMessage = satoMessage.split('-');

        const messages = [kenobiMessage, skywalkerMessage, satoMessage];
        const message = getMessage(messages);
        // redisClient.flushall(); // flush variables so it can be processed again

        res.status(200).json({
            position: {
                x: x,
                y: y
            },
            message: message
        });
    });
});


module.exports = router;