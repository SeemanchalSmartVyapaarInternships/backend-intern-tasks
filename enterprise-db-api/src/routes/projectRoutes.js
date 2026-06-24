'use strict';

const router       = require('express').Router();
const ctrl         = require('../controllers/projectController');
const validate     = require('../middlewares/validate');
const { project }  = require('../validators/schemas');

router.get('/',    ctrl.getAllProjects);
router.get('/:id', ctrl.getProjectById);
router.post('/',   validate(project.create), ctrl.createProject);
router.put('/:id', validate(project.update), ctrl.updateProject);
router.delete('/:id', ctrl.deleteProject);

// Member management sub-routes
router.post('/:id/members',             ctrl.addMember);
router.delete('/:id/members/:userId',   ctrl.removeMember);

module.exports = router;
