require('dotenv').config();
const mongoose = require('mongoose');
const Cliente = require('./models/Cliente');
const Servicio = require('./models/Servicio');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelanceDB';

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Conectado para seed');

  await Cliente.deleteMany({});
  await Servicio.deleteMany({});

  const cliente = await Cliente.create({
    nombreCliente: 'ACME S.A.',
    email: 'contacto@acme.com',
    telefono: '6000-0000'
  });

  const servicios = await Servicio.insertMany([
    { nombreServicio: 'Formateo e Instalación SO', precioBase: 50.00, descripcion: 'Formateo y reinstalación del sistema operativo' },
    { nombreServicio: 'Mantenimiento Preventivo PC', precioBase: 30.00, descripcion: 'Limpieza y revisión de hardware' },
    { nombreServicio: 'Soporte Remoto', precioBase: 20.00, descripcion: 'Soporte por hora vía remoto' }
  ]);

  console.log('Seed completado');
  console.log('Cliente ID:', cliente._id.toString());
  servicios.forEach(s => console.log('Servicio ID:', s._id.toString()));

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
