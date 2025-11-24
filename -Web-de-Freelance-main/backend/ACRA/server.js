require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const clientesRouter = require('./routes/clientes');
const serviciosRouter = require('./routes/servicios');
const cotizacionesRouter = require('./routes/cotizaciones');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => res.json({ status: 'API funcionando' }));

app.use('/api/clientes', clientesRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/cotizaciones', cotizacionesRouter);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelanceDB';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => console.log(`Server en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err.message);
  });
