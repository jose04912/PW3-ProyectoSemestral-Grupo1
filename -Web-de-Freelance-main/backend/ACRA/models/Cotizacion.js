const { Schema, model, Types } = require('mongoose');

const ItemSchema = new Schema({
  servicioId: { type: Types.ObjectId, ref: 'Servicio', required: true },
  nombreServicio: { type: String, required: true },
  precioUnitario: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1 },
  totalItem: { type: Number, required: true, min: 0 }
});

const CotizacionSchema = new Schema({
  idCotizacion: { type: String, required: true, unique: true },
  clienteId: { type: Types.ObjectId, ref: 'Cliente', required: true },
  nombreCliente: { type: String, required: true },
  fechaCotizacion: { type: Date, default: Date.now },
  items: [ItemSchema],
  subTotal: { type: Number, required: true, min: 0 },
  impuesto: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
});

module.exports = model('Cotizacion', CotizacionSchema);
