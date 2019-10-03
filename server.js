require('./src/config/firebase');

const express = require('express');
const appConfig = require('./src/config/app.json');
const router = require('./src/config/router');

const app = express();

app.use(express.json());

router(app);

// eslint-disable-next-line no-console
app.listen(appConfig.server.port, () => console.log('Listening on port 3000!'));