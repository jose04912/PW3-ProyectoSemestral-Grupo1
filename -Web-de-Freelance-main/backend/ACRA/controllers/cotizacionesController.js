const Cotizacion = require('../models/Cotizacion');
const Cliente = require('../models/Cliente');
const Servicio = require('../models/Servicio');
const { Types } = require('mongoose');

const TAX_RATE = 0.08; // 8%

async function createCotizacion(req, res) {
  try {
    const { clienteId, items } = req.body;
    if (!Types.ObjectId.isValid(clienteId)) return res.status(400).json({ error: 'clienteId inválido' });

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    let subTotal = 0;
    const processedItems = [];

    for (const it of items) {
      if (!Types.ObjectId.isValid(it.servicioId)) return res.status(400).json({ error: 'servicioId inválido' });
      const servicio = await Servicio.findById(it.servicioId);
      if (!servicio) return res.status(404).json({ error: `Servicio ${it.servicioId} no existe` });

      const precio = Number(it.precioUnitario);
      const cantidad = Number(it.cantidad);
      if (cantidad < 1 || precio < 0) return res.status(400).json({ error: 'Cantidad o precio inválido' });

      const totalItem = parseFloat((precio * cantidad).toFixed(2));
      subTotal += totalItem;
      processedItems.push({
        servicioId: servicio._id,
        nombreServicio: servicio.nombreServicio,
        precioUnitario: precio,
        cantidad,
        totalItem
      });
    }

    subTotal = parseFloat(subTotal.toFixed(2));
    const impuesto = parseFloat((subTotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subTotal + impuesto).toFixed(2));
    const idCotizacion = `COT-${Date.now()}`;

    const cot = new Cotizacion({
      idCotizacion, clienteId, nombreCliente: cliente.nombreCliente,
      items: processedItems, subTotal, impuesto, total
    });

    await cot.save();
    return res.status(201).json(cot);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}

async function listCotizaciones(req, res) {
  try {
    const { clienteId, desde, hasta, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (clienteId) filter.clienteId = clienteId;
    if (desde || hasta) {
      filter.fechaCotizacion = {};
      if (desde) filter.fechaCotizacion.$gte = new Date(desde);
      if (hasta) filter.fechaCotizacion.$lte = new Date(hasta);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const cotizaciones = await Cotizacion.find(filter)
      .sort({ fechaCotizacion: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json(cotizaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateCotizacion(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;
    // Reuse create logic: validate items and recalc totals
    // For brevity, simple replace + recalc using same logic as create
    const existing = await Cotizacion.findById(id);
    if (!existing) return res.status(404).json({ error: 'Cotización no encontrada' });

    // If clienteId changed, validate
    if (body.clienteId && !Types.ObjectId.isValid(body.clienteId)) return res.status(400).json({ error: 'clienteId inválido' });
    const cliente = body.clienteId ? await Cliente.findById(body.clienteId) : await Cliente.findById(existing.clienteId);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Validate items
    let subTotal = 0;
    const processedItems = [];
    for (const it of body.items || existing.items) {
      if (!Types.ObjectId.isValid(it.servicioId)) return res.status(400).json({ error: 'servicioId inválido' });
      const servicio = await Servicio.findById(it.servicioId);
      if (!servicio) return res.status(404).json({ error: `Servicio ${it.servicioId} no existe` });
      const precio = Number(it.precioUnitario);
      const cantidad = Number(it.cantidad);
      if (cantidad < 1 || precio < 0) return res.status(400).json({ error: 'Cantidad o precio inválido' });
      const totalItem = parseFloat((precio * cantidad).toFixed(2));
      subTotal += totalItem;
      processedItems.push({
        servicioId: servicio._id,
        nombreServicio: servicio.nombreServicio,
        precioUnitario: precio,
        cantidad,
        totalItem
      });
    }

    subTotal = parseFloat(subTotal.toFixed(2));
    const impuesto = parseFloat((subTotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subTotal + impuesto).toFixed(2));

    existing.clienteId = cliente._id;
    existing.nombreCliente = cliente.nombreCliente;
    existing.items = processedItems;
    existing.subTotal = subTotal;
    existing.impuesto = impuesto;
    existing.total = total;

    await existing.save();
    res.json(existing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteCotizacion(req, res) {
  try {
    const { id } = req.params;
    await Cotizacion.findByIdAndDelete(id);
    res.json({ message: 'Cotización eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createCotizacion,
  listCotizaciones,
  updateCotizacion,
  deleteCotizacion
};
