'use strict';

const router     = require('express').Router();
const ctrl       = require('../controllers/roleController');
const validate   = require('../middlewares/validate');
const { role }   = require('../validators/schemas');

router.get('/',    ctrl.getAllRoles);
router.get('/:id', ctrl.getRoleById);
router.post('/',   validate(role.create), ctrl.createRole);
router.put('/:id', validate(role.update), ctrl.updateRole);
router.delete('/:id', ctrl.deleteRole);

module.exports = router;
