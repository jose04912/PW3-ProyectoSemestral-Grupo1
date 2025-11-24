const { Schema, model } = require('mongoose');

const ClienteSchema = new Schema({
  nombreCliente: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },
  telefono: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now }
});

module.exports = model('Cliente', ClienteSchema);
