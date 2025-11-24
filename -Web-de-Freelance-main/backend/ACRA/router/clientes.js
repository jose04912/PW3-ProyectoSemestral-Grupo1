const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');

// Crear cliente
router.post('/', async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar clientes
router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ nombreCliente: 1 });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(cliente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
