const { requireJwtAuth } = require('~/server/middleware');

const express = require('express');
const router = express.Router();

const {
  createTrainingOrganization,
  getListTrainingOrganizations,
  deleteTrainingOrganization,
  getTrainingOrganizationById,
  addAdministrator,
  removeAdministrator,
  addTrainer,
  removeTrainer,
} = require('~/server/controllers/TrainingOrganizationController');
const { checkAdmin, checkOrgAccess } = require('~/server/middleware/roles');

router.post('/', requireJwtAuth, checkAdmin, createTrainingOrganization);
router.get('/', requireJwtAuth, getListTrainingOrganizations);
router.get('/:organizationId', requireJwtAuth, checkOrgAccess, getTrainingOrganizationById);
router.delete('/:organizationId', requireJwtAuth, checkAdmin, deleteTrainingOrganization);
router.post('/:organizationId/administrators', requireJwtAuth, checkOrgAccess, addAdministrator);
router.delete(
  '/:organizationId/administrators/:email',
  requireJwtAuth,
  checkOrgAccess,
  removeAdministrator,
);
router.post('/:organizationId/trainers', requireJwtAuth, checkOrgAccess, addTrainer);
router.delete('/:organizationId/trainers/:email', requireJwtAuth, checkOrgAccess, removeTrainer);

module.exports = router;
