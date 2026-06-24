'use strict';

const router           = require('express').Router();
const ctrl             = require('../controllers/departmentController');
const validate         = require('../middlewares/validate');
const { department }   = require('../validators/schemas');

router.get('/',    ctrl.getAllDepartments);
router.get('/:id', ctrl.getDepartmentById);
router.post('/',   validate(department.create), ctrl.createDepartment);
router.put('/:id', validate(department.update), ctrl.updateDepartment);
router.delete('/:id', ctrl.deleteDepartment);

module.exports = router;
