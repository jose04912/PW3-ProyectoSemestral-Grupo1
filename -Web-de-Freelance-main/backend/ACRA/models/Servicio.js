const { Schema, model } = require('mongoose');

const ServicioSchema = new Schema({
  nombreServicio: { type: String, required: true },
  precioBase: { type: Number, required: true, min: 0 },
  descripcion: { type: String }
});

module.exports = model('Servicio', ServicioSchema);
