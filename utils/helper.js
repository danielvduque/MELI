const trilateration = require('node-trilateration');

const getLocations = (distances) => {
    /* 1: kenobi, 2: skywalker, 3: sato */
    const x1 = parseFloat(process.env.KENOBI_X);
    const y1 = parseFloat(process.env.KENOBI_Y);
    const x2 = parseFloat(process.env.SKYWALKER_X);
    const y2 = parseFloat(process.env.SKYWALKER_Y);
    const x3 = parseFloat(process.env.SATO_X);
    const y3 = parseFloat(process.env.SATO_Y);
    const [r1, r2, r3] = distances;

    const positions = [
        {x: x1, y: y1, distance: r1},
        {x: x2, y: y2, distance: r2},
        {x: x3, y: y3, distance: r3}
    ];

    const position = trilateration.calculate(positions);
    const x = position.x;
    const y = position.y;

    return {x, y};
};

const getMessage = (messages) => {
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
};

exports.getLocations = getLocations;
exports.getMessage = getMessage;