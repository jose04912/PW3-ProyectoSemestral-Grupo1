const express = require('express');
const router = express.Router();
const Servicio = require('../models/Servicio');

// Crear servicio
router.post('/', async (req, res) => {
  try {
    const servicio = new Servicio(req.body);
    await servicio.save();
    res.status(201).json(servicio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar servicios
router.get('/', async (req, res) => {
  try {
    const servicios = await Servicio.find().sort({ nombreServicio: 1 });
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar servicio
router.put('/:id', async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(servicio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar servicio
router.delete('/:id', async (req, res) => {
  try {
    await Servicio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Servicio eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
