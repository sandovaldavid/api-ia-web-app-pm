const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest, taskValidations } = require('../middlewares/validateRequest');
const taskController = require('../controllers/taskController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Task parameterization routes
router
    .route('/:taskId/parameterize')
    .get(taskValidations.parameterize, validateRequest, taskController.parameterizeTask);

router.route('/:taskId').get(taskController.getTaskById);

// Documentation generation routes
router
    .route('/:taskId/documentation')
    .get(taskValidations.parameterize, validateRequest, taskController.generateDocumentation);

// Task time estimation routes
router.route('/:taskId/estimate').get(taskValidations.parameterize, validateRequest, taskController.estimateTaskTime);

// Project analysis routes
router.route('/projects/:projectId/analyze').get(taskController.analyzeProject);

module.exports = router;
