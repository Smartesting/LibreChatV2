const express = require('express');
const {
  acceptInvitationController,
  getAdminInvitationsController,
  getOrgAdminInvitationsController,
  getOrgTrainerInvitationsController,
} = require('~/server/controllers/InvitationController');
const { requireJwtAuth } = require('~/server/middleware');
const { checkAdmin, checkOrgAccess } = require('~/server/middleware/roles');

const router = express.Router();

router.post('/accept', acceptInvitationController);
router.get('/admins', requireJwtAuth, checkAdmin, getAdminInvitationsController);
router.get(
  '/organizations/:organizationId/admins',
  requireJwtAuth,
  checkOrgAccess,
  getOrgAdminInvitationsController,
);
router.get(
  '/organizations/:organizationId/trainers',
  requireJwtAuth,
  checkOrgAccess,
  getOrgTrainerInvitationsController,
);

module.exports = router;
