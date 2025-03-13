const express = require('express');
const {
    parameterizeTask,
    generateDocumentation,
    estimateTaskTime,
    analyzeProject,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All task routes are protected
router.use(protect);

// Task routes
router.get('/:taskId/parameterize', validate(schemas.task.parameterize, 'params'), parameterizeTask);
router.get('/:taskId/documentation', validate(schemas.task.parameterize, 'params'), generateDocumentation);
router.get('/:taskId/estimate', validate(schemas.task.parameterize, 'params'), estimateTaskTime);

// Project analysis
router.get('/projects/:projectId/analyze', validate(schemas.task.project, 'params'), analyzeProject);

module.exports = router;
