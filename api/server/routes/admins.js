const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const { checkAdmin } = require('~/server/middleware/roles');
const {
  grantAdminAccessController,
  revokeAdminAccessController,
  getAdminUsersController,
} = require('~/server/controllers/AdminController');
const router = express.Router();

router.post('/grant-access', requireJwtAuth, checkAdmin, grantAdminAccessController);
router.post('/revoke-access', requireJwtAuth, checkAdmin, revokeAdminAccessController);
router.get('/', requireJwtAuth, checkAdmin, getAdminUsersController);

module.exports = router;
