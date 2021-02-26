const request = require('supertest');
const app = require('../index');
const redis = require('../redis');

// Clean redis before all tests
beforeAll(() => {
    redis.flushRedis();
});

beforeEach(async () => {
    process.env.PORT = 3000;
    process.env.KENOBI_X = 500;
    process.env.KENOBI_Y = -200;
    process.env.SKYWALKER_X = 100;
    process.env.SKYWALKER_Y = -100;
    process.env.SATO_X = 500;
    process.env.SATO_Y = 100;
});

// Body for topsecret post
let body = {
    "satellites": [
        {
            "name": "skywalker",
            "distance": 500,
            "message": ["", "", "este", "", "es", "", "mensaje", "secreto"]
        },
        {
            "name": "kenobi",
            "distance": 1029.56,
            "message": ["", "este", "", "es", "un", "mensaje", ""]
        },
        {
            "name": "sato",
            "distance": 223.61,
            "message": ["", "", "", "quiza", "es", "", "secreto", ""]
        }
    ]
};

// split cases
describe('topsecret_split GET fail', () => {
    test('It should return position and message', async () => {
        const res = await request(app)
            .get('/topsecret_split');

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toEqual('Not enough information.');
    });
});

describe('topsecret_split POST fail', () => {
    test('It should fail and return 400', async () => {
        const res = await request(app)
            .post('/topsecret_split/cualquiernombre')
            .type('json')
            .send({ distance: 728.01, message: ['', 'este', '', 'es', 'un', 'mensaje', ''] });

        expect(res.statusCode).toEqual(400);
    });
});

describe('topsecret_split POST - kenobi', () => {
    test('It should accept and return 204', async () => {
        const res = await request(app)
            .post('/topsecret_split/kenobi')
            .type('json')
            .send({ distance: 1029.56, message: ['', 'este', '', 'es', 'un', 'mensaje', ''] });

        expect(res.statusCode).toEqual(204);
    });
});

describe('topsecret_split POST - sato', () => {
    test('It should accept and return 204', async () => {
        const res = await request(app)
            .post('/topsecret_split/sato')
            .type('json')
            .send({ distance: 223.61, message: ['este', '', 'quiza', 'es', '', 'secreto', ''] });

        expect(res.statusCode).toEqual(204);
    });
});

describe('topsecret_split POST - skywalker', () => {
    test('It should accept and return 204', async () => {
        const res = await request(app)
            .post('/topsecret_split/skywalker')
            .type('json')
            .send({ distance: 500, message: ['', 'quiza', '', 'es', 'un', 'mensaje', 'secreto'] });

        expect(res.statusCode).toEqual(204);
    });
});

// repeat kenobi to validate the satellite name was already saved
describe('topsecret_split POST - kenobi again', () => {
    test('It should accept and return 204', async () => {
        const res = await request(app)
            .post('/topsecret_split/kenobi')
            .type('json')
            .send({ distance: 1029.56, message: ['', 'este', '', 'es', 'un', 'mensaje', ''] });

        expect(res.statusCode).toEqual(204);
    });
});

describe('topsecret_split GET ok', () => {
    test('It should return position and message', async () => {
        const res = await request(app)
            .get('/topsecret_split');

        expect(res.statusCode).toEqual(200);
        expect(res.body.position).toBeTruthy();
        expect(res.body.position).toHaveProperty('x');
        expect(res.body.position).toHaveProperty('y');
        expect(res.body.message).toEqual('este quiza es un mensaje secreto');
    });
});

// topsecret
describe('topsecret ok', () => {
    test('It should return position and message', async () => {
        const res = await request(app)
            .post('/topsecret')
            .type('json')
            .send(body);

        expect(res.statusCode).toEqual(200);
        expect(res.body.position).toBeTruthy();
        expect(res.body.position).toHaveProperty('x');
        expect(res.body.position).toHaveProperty('y');
        expect(res.body.message).toEqual('este quiza es un mensaje secreto');
    });
});

describe('topsecret fail', () => {
    test('It should fail and return 404', async () => {
        body.satellites[0].name = 'cualquieradiferente';

        const res = await request(app)
            .post('/topsecret')
            .type('json')
            .send(body);

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('Non processable');
    });
});

// Validation cases
describe('topsecret validations', () => {
    test('It should fail and return 404', async () => {
        const res = await request(app)
            .post('/topsecret')
            .type('json')
            .send({satellites: []});

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
    });
});

describe('topsecret split validations', () => {
    test('It should fail and return 404', async () => {
        const res = await request(app)
            .post('/topsecret_split/sato')
            .type('json')
            .send({distance: 1, message: [] });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
    });
});

// index
describe('home response', () => {
    test('It should return a message', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual('Desafio - Operación fuego de Quasar.');
    });
});

describe('invalid route - 404', () => {
    test('It should return an error with 404 status', async () => {
        const res = await request(app).get('/cualquier/ruta');

        expect(res.statusCode).toEqual(404);
    });
});