'use strict';

const router     = require('express').Router();
const ctrl       = require('../controllers/taskController');
const validate   = require('../middlewares/validate');
const { task }   = require('../validators/schemas');

router.get('/',    ctrl.getAllTasks);
router.get('/:id', ctrl.getTaskById);
router.post('/',   validate(task.create), ctrl.createTask);
router.put('/:id', validate(task.update), ctrl.updateTask);
router.delete('/:id', ctrl.deleteTask);

module.exports = router;
