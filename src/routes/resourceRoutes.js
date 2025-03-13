const express = require('express');
const {
    assignResourceToTask,
    assignResourcesForProject,
    getResources,
    getProjectResources,
} = require('../controllers/resourceController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All resource routes are protected
router.use(protect);

// Resource routes
router.get('/', getResources);
router.get('/assign/:taskId', validate(schemas.task.resource, 'params'), assignResourceToTask);
router.get('/assign/project/:projectId', validate(schemas.task.project, 'params'), assignResourcesForProject);
router.get('/project/:projectId', validate(schemas.task.project, 'params'), getProjectResources);

module.exports = router;
