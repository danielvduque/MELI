const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const {getLocations, getMessage} = require('../utils/helper');
const redis = require('../redis');

const topsecretValidation = [
    check('satellites').isArray({ min:1 }).withMessage('Satellites must be an array'),
    check('satellites.*.name').notEmpty().withMessage('Name is required').isString().withMessage('Must be string'),
    check('satellites.*.distance').notEmpty().withMessage('Distance is required').isFloat().withMessage('Distance must be float'),
    check('satellites.*.message').isArray({ min:1 }).withMessage('Message must be a not empty array'),
    check('satellites.*.message.*').isString().optional().withMessage('Message content must be string')
];

router.post('/topsecret', topsecretValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }

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
        return res.status(404).json({error: 'Non processable'});
    }
    
    res.status(200).json({
        position: {
            x: x,
            y: y
        },
        message: message
    });
    
});

const splitValidation = [
    check('distance').notEmpty().withMessage('Distance is required').isFloat().withMessage('Distance must be float'),
    check('message').isArray({ min:1 }).withMessage('Message must be a not empty array'),
    check('message.*').isString().optional().withMessage('Message content must be string')
];

router.post('/topsecret_split/:satellite', splitValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }

    const satelliteNames = ['kenobi','skywalker','sato'];
    const {satellite} = req.params;
    let names = [];
    let allNames = '';

    if(!satelliteNames.includes(satellite.toLowerCase())){
        return res.sendStatus(400);
    }

    let distanceKey = `${satellite.toLowerCase()}Distance`;
    let messageKey = `${satellite.toLowerCase()}Message`;
    let transformedMessage = req.body.message.join('-');

    redis.redisClient.get('satellites', (err, value) => {
        if(value === null){
            return redis.redisClient.set('satellites', satellite, () => {});
        }
        
        names = value.split('-');
        if(!names.includes(satellite)){
            names.push(satellite);
            allNames = names.join('-');
            redis.redisClient.set('satellites', allNames, () => {});
        }
    });

    redis.redisClient.set(distanceKey, req.body.distance, () => {});
    redis.redisClient.set(messageKey, transformedMessage, () => {});

    res.sendStatus(204);
}); 

router.get('/topsecret_split', (req, res) => {
    redis.redisClient.get('satellites', async (err, value) => {
        const TOTAL_SATELLITES = 3;
        let sats = value ? value.split('-') : [];

        if(sats.length !== TOTAL_SATELLITES){
            return res.status(400).json({message: 'Not enough information.'});
        }

        let kenobiDistance = await redis.redisClient.getAsync('kenobiDistance');
        let skywalkerDistance = await redis.redisClient.getAsync('skywalkerDistance');
        let satoDistance = await redis.redisClient.getAsync('satoDistance');
        kenobiDistance = parseFloat(kenobiDistance);
        skywalkerDistance = parseFloat(skywalkerDistance);
        satoDistance = parseFloat(satoDistance);

        const distances = [kenobiDistance, skywalkerDistance, satoDistance];
        const {x,y} = getLocations(distances);

        let kenobiMessage = await redis.redisClient.getAsync('kenobiMessage');
        let skywalkerMessage = await redis.redisClient.getAsync('skywalkerMessage');
        let satoMessage = await redis.redisClient.getAsync('satoMessage');

        kenobiMessage = kenobiMessage.split('-');
        skywalkerMessage = skywalkerMessage.split('-');
        satoMessage = satoMessage.split('-');

        const messages = [kenobiMessage, skywalkerMessage, satoMessage];
        const message = getMessage(messages);

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