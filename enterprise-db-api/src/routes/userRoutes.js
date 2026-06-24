'use strict';

const router     = require('express').Router();
const ctrl       = require('../controllers/userController');
const validate   = require('../middlewares/validate');
const { user }   = require('../validators/schemas');

router.get('/',    ctrl.getAllUsers);
router.get('/:id', ctrl.getUserById);
router.post('/',   validate(user.create), ctrl.createUser);
router.put('/:id', validate(user.update), ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

module.exports = router;
