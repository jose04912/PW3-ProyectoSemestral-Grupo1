const router = require('express').Router();
const controller = require('../controllers/cotizacionesController');

router.post('/', controller.createCotizacion);
router.get('/', controller.listCotizaciones);
router.put('/:id', controller.updateCotizacion);
router.delete('/:id', controller.deleteCotizacion);

module.exports = router;
