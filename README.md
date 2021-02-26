# Operación Fuego de Quasar

## Tecnologías
El desafío usa como solución un servidor en [nodejs](https://nodejs.org/) con [expressjs](http://expressjs.com/) como framework.

## Prerequisitos
Para levantar el servidor local es necesario instalar [nodejs](https://nodejs.org/), [npm](https://docs.npmjs.com/getting-started/configuring-your-local-environment) y [redis](https://redis.io/)

## Instalación
- Clonar el repositorio e ingresar al directorio
- Instalar dependencias: `npm install`
- Copiar archivo `.env.example` a `.env`
- Modificar `.env` y agregar los valores correspondientes a las coordenadas de los satelites, así como el host y puerto de redis
- Levantar el servidor: `npm start`

El servidor estará disponible en `http://localhost:PUERTO/` según el valor del puerto que quede configurado en `.env`.

## Tests
Después de realizar los pasos de la sección anterior es posible ejecutar tests unitarios con `npm run test`

## Información util
1) El servidor se encuentra disponible en https://meli-305519.uc.r.appspot.com
2) Dentro del directorio `extras` se encuentran:
    - Swagger (openapi) con la información detallada por endpoint 
    - Colección postman para ejecutar en el servidor del punto 1

## Contacto
Comentarios / dudas / consultas a danielvduque@gmail.com