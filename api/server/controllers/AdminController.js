const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('~/config');
const { processGrantAdminAccess } = require('~/server/services/AdminService');
const {
  User,
  findUser,
  updateUser,
  findAdminInvitationByEmail,
  removeAdminRoleFromInvitation,
} = require('~/models');

/**
 * Controller function to grant admin access
 * @param {Object} req - Express request object with email in the body
 * @param {Object} res - Express response object
 */
const grantAdminAccessController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await processGrantAdminAccess(email);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    logger.info(`Admin invitation sent to ${email}`);
    res.status(result.status).json({ message: result.message });
  } catch (error) {
    logger.error('Error sending admin invitation:', error);
    res.status(500).json({ message: 'Error sending admin invitation' });
  }
};

/**
 * Controller function to revoke admin access
 * @param {Object} req - Express request object with email in the body
 * @param {Object} res - Express response object
 */
const revokeAdminAccessController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await findUser({ email }, 'email _id role');

    if (user) {
      // If user exists and has ADMIN role, remove the role
      if (user.role.includes(SystemRoles.ADMIN)) {
        const updatedUser = await updateUser(user._id, {
          role: user.role.filter((r) => r !== SystemRoles.ADMIN),
        });

        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update user role' });
        }

        logger.info(`Admin role removed from user ${email}`);
        return res.status(200).json({ message: 'Admin role removed successfully' });
      } else {
        return res.status(400).json({ message: 'User does not have admin role' });
      }
    } else {
      // If user doesn't exist, check if there's an admin invitation
      const invitation = await findAdminInvitationByEmail(email);

      if (invitation) {
        // Delete the invitation
        await removeAdminRoleFromInvitation(invitation._id);
        logger.info(`Admin invitation deleted for ${email}`);
        return res.status(200).json({ message: 'Admin invitation deleted successfully' });
      } else {
        return res.status(404).json({ message: 'User not found and no pending invitation exists' });
      }
    }
  } catch (error) {
    logger.error('Error removing admin role:', error);
    res.status(500).json({ message: 'Error removing admin role' });
  }
};

/**
 * Controller function to get all users with ADMIN role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAdminUsersController = async (req, res) => {
  try {
    const adminUsers = await User.find({ role: SystemRoles.ADMIN }, { password: 0, totpSecret: 0 });
    res.status(200).json(adminUsers);
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Error fetching admin users' });
  }
};

module.exports = {
  grantAdminAccessController,
  revokeAdminAccessController,
  getAdminUsersController,
};
