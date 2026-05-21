const { logger } = require('~/config');
const { SystemRoles } = require('librechat-data-provider');
const { registerUser } = require('~/server/services/AuthService');
const {
  findUser,
  updateUser,
  findInvitationByEmailAndToken,
  deleteInvitationById,
  findAllAdminInvitations,
  findOrgAdminInvitationsByOrgId,
  findTrainerInvitationsByOrgId,
  addTrainerToOrganization,
  addAdminToOrganization,
} = require('~/models');

/**
 * Controller function to accept an invitation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const acceptInvitationController = async (req, res) => {
  try {
    const { token, email, password, confirm_password, name, username } = req.body;

    if (!token || !email || !password || !confirm_password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the invitation with the matching email and token
    const invitation = await findInvitationByEmailAndToken(email, token);

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation token' });
    }

    // Register the new user
    const userData = {
      email,
      password,
      confirm_password,
      name,
      username: username || '',
    };

    const registerResult = await registerUser(userData, {
      emailVerified: true,
      role: [],
    });

    if (registerResult.status !== 200) {
      return res.status(registerResult.status).json({ error: registerResult.message });
    }

    // Find the newly created user
    const user = await findUser({ email });
    if (!user) {
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    const roles = new Set();

    if (invitation.roles.superAdmin) {
      roles.add(SystemRoles.ADMIN);
    }

    // Add user as admin to organizations in invitation.roles.orgAdmin
    for (const orgId of invitation.roles.orgAdmin) {
      try {
        const updatedOrganization = await addAdminToOrganization(orgId, user._id, user.email);
        if (updatedOrganization !== null) {
          roles.add(SystemRoles.ORGADMIN);
        }
      } catch {
        /* empty */
      }
    }

    // Add user as trainer to organizations in invitation.roles.orgTrainer
    for (const orgId of invitation.roles.orgTrainer) {
      try {
        const updatedOrganization = await addTrainerToOrganization(orgId, user._id, user.email);
        if (updatedOrganization !== null) {
          roles.add(SystemRoles.TRAINER);
        }
      } catch {
        /* empty */
      }
    }

    await updateUser(user._id, { role: Array.from(roles) });

    try {
      await deleteInvitationById(invitation._id);
    } catch {
      /* empty */
    }

    res.status(200).json({
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    logger.error('[/invitations/accept] Error accepting invitation', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Controller function to get all admin invitations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAdminInvitationsController = async (req, res) => {
  try {
    const adminsInvitations = await findAllAdminInvitations();
    res.status(200).json(adminsInvitations);
  } catch (error) {
    logger.error('[/invitations/admins] Error getting admins invitations', error);
    res.status(500).json({ message: 'Error retrieving admin invitations' });
  }
};

/**
 * Controller function to get the admin invitations of an organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrgAdminInvitationsController = async (req, res) => {
  const { organizationId } = req.params;

  if (!organizationId) {
    return res.status(400).json({ message: 'Missing required orgId' });
  }

  try {
    const orgAdminInvitations = await findOrgAdminInvitationsByOrgId(organizationId);
    res.status(200).json(orgAdminInvitations);
  } catch (error) {
    logger.error(
      '[/invitations/organizations/:organizationId/admins] Error getting organization admin invitations',
      error,
    );
    res.status(500).json({ message: 'Error retrieving organization admin invitations' });
  }
};

/**
 * Controller function to get the trainer invitations of an organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrgTrainerInvitationsController = async (req, res) => {
  const { organizationId } = req.params;

  if (!organizationId) {
    return res.status(400).json({ message: 'Missing required orgId' });
  }

  try {
    const orgTrainerInvitations = await findTrainerInvitationsByOrgId(organizationId);
    res.status(200).json(orgTrainerInvitations);
  } catch (error) {
    logger.error(
      '[/invitations/organizations/:organizationId/trainers] Error getting organization trainer invitations',
      error,
    );
    res.status(500).json({ message: 'Error retrieving organization trainer invitations' });
  }
};

module.exports = {
  acceptInvitationController,
  getAdminInvitationsController,
  getOrgAdminInvitationsController,
  getOrgTrainerInvitationsController,
};
