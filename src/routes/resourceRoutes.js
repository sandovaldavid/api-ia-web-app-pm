const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest, resourceValidations } = require('../middlewares/validateRequest');
const resourceController = require('../controllers/resourceController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Resource assignment routes
router
    .route('/assign/:taskId')
    .get(resourceValidations.assign, validateRequest, resourceController.assignResourceToTask);

// Project resource assignment routes
router.route('/assign/project/:projectId').get(resourceController.assignResourcesForProject);

// Get all resources
router.route('/').get(resourceController.getResources);

// Get resources for a project
router.route('/project/:projectId').get(resourceController.getProjectResources);

module.exports = router;
