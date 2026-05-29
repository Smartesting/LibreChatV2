const { SystemRoles } = require('librechat-data-provider');
const { getTrainingOrganizationById } = require('~/models');

/**
 * Middleware to check if the user is a super admin or an administrator of the organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
async function checkOrgAccess(req, res, next) {
  try {
    const roleArr = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    // If user is a super admin, allow access
    if (roleArr.includes(SystemRoles.ADMIN)) {
      return next();
    }

    if (!roleArr.includes(SystemRoles.ORGADMIN)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get the organization ID from the request parameters
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ message: 'Missing organization ID' });
    }

    // Get the organization
    const organization = await getTrainingOrganizationById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if the user is an administrator of the organization
    const isOrgAdmin = organization.administrators.some(
      (admin) => admin._id && admin._id.toString() === req.user.id,
    );

    if (!isOrgAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  } catch (error) {
    console.error('Error in checkOrgAccess middleware:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = checkOrgAccess;
