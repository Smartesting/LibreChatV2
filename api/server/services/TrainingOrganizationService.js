const { SystemRoles } = require('librechat-data-provider');
const { sendEmail } = require('~/server/utils');
const { logger } = require('~/config');
const {
  findUser,
  updateUser,
  createOrgAdminInvitation,
  createTrainerInvitation,
  addAdminToOrganization,
  addTrainerToOrganization,
  removeAdminFromOrganization,
  removeTrainerFromOrganization,
  findTrainingOrganizationsByAdmin,
  findTrainingOrganizationsByTrainer,
} = require('~/models');
const { checkEmailConfig } = require('@librechat/api');

/**
 * Process administrators for a training organization
 * @param {Array} administrators - Array of administrator emails
 * @param {string} orgId - The ID of the training organization
 * @param {string} orgName - The name of the training organization
 * @returns {Promise<void>}
 */
const processAdministrators = async (administrators, orgId, orgName) => {
  if (!administrators || !Array.isArray(administrators)) {
    return [];
  }

  // Remove duplicate administrators
  const uniqueAdministrators = Array.from(
    new Set(administrators.map((email) => email.toLowerCase())),
  );

  for (const email of uniqueAdministrators) {
    // Check if user exists
    const existingUser = await findUser({ email }, 'email _id name username role');

    if (existingUser) {
      // If user already exists and has TRAINEE role, skip adding him as an org admin
      if (existingUser.role.includes(SystemRoles.TRAINEE)) {
        continue;
      }

      await addAdminToOrganization(orgId, existingUser._id, existingUser.email);

      // Only add ORGADMIN role if the user doesn't already have it
      if (!existingUser.role.includes(SystemRoles.ORGADMIN)) {
        const role = Array.isArray(existingUser.role) ? existingUser.role : [existingUser.role];
        await updateUser(existingUser._id, {
          role: [...role, SystemRoles.ORGADMIN],
        });
      }

      logger.info(
        `[processAdministrators] User ${email} has been granted admin role for organization ${orgName}`,
      );

      // Send notification email to existing user
      await sendOrgAdminNotificationEmail(existingUser, orgName);
    } else {
      // User doesn't exist, generate invitation token
      const { token } = await createOrgAdminInvitation(email, orgId);

      // Send invitation email
      await sendOrgAdminInvitationEmail(email, token, orgName);
    }
  }
};

/**
 * Send notification email to existing user
 * @param {Object} user - User object with email, name, and username
 * @param {string} orgName - The name of the training organization
 * @returns {Promise<void>}
 */
const sendOrgAdminNotificationEmail = async (user, orgName) => {
  try {
    const loginLink = `${process.env.DOMAIN_CLIENT}/login`;

    // Check if email configuration is available
    if (!checkEmailConfig()) {
      logger.info(
        `[sendOrgAdminNotificationEmail] Email configuration not available. Cannot send notification to [Email: ${user.email}] [Org: ${orgName}] [loginLink: ${loginLink}]`,
      );
      return;
    }

    await sendEmail({
      email: user.email,
      subject: `You are now an administrator of ${orgName}`,
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: user.name || user.username || user.email,
        orgName,
        loginLink,
      },
      template: 'orgAdminNotification.handlebars',
    });

    logger.info(
      `[sendOrgAdminNotificationEmail] Admin notification sent. [Email: ${user.email}] [Org: ${orgName}] [loginLink: ${loginLink}]`,
    );
  } catch (error) {
    logger.error(`[sendOrgAdminNotificationEmail] Error sending notification: ${error.message}`);
    throw error;
  }
};

/**
 * Send invitation email to new administrator
 * @param {string} email - The email address to send the invitation to
 * @param {string} token - The invitation token
 * @param {string} orgName - The name of the training organization
 * @returns {Promise<void>}
 */
const sendOrgAdminInvitationEmail = async (email, token, orgName) => {
  try {
    const inviteLink = `${process.env.DOMAIN_CLIENT}/org-admin-invite?token=${token}&email=${encodeURIComponent(email)}&orgName=${encodeURIComponent(orgName)}`;

    // Check if email configuration is available
    if (!checkEmailConfig()) {
      logger.info(
        `[sendOrgAdminInvitationEmail] Email configuration not available. Cannot send invitation to [Email: ${email}] [Org: ${orgName}] [inviteLink: ${inviteLink}]`,
      );
      return;
    }

    await sendEmail({
      email,
      subject: `Invitation to join ${orgName} as an administrator`,
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: email,
        orgName: orgName,
        inviteLink,
      },
      template: 'orgAdminInvite.handlebars',
    });

    logger.info(
      `[sendOrgAdminInvitationEmail] Invitation sent. [Email: ${email}] [Org: ${orgName}] [inviteLink: ${inviteLink}]`,
    );
  } catch (error) {
    logger.error(`[sendOrgAdminInvitationEmail] Error sending invitation: ${error.message}`);
    throw error;
  }
};

/**
 * Process trainers for a training organization
 * @param {Array} trainers - Array of trainer emails
 * @param {string} orgId - The ID of the training organization
 * @param {string} orgName - The name of the training organization
 * @returns {Promise<{result: boolean, errorCode?: number, errorMsg?: string}>}
 */
const processTrainers = async (trainers, orgId, orgName) => {
  if (!trainers || !Array.isArray(trainers)) {
    return { result: false, errorCode: 422, errorMsg: 'No trainers provided' };
  }

  const uniqueTrainers = Array.from(new Set(trainers.map((email) => email.toLowerCase())));

  for (const email of uniqueTrainers) {
    const existingUser = await findUser({ email }, 'email _id name username role');

    if (existingUser) {
      // If user already exists and has TRAINEE role, skip adding him as a trainer
      if (existingUser.role.includes(SystemRoles.TRAINEE)) {
        return { result: false, errorCode: 422, errorMsg: 'Trainee cannot be added as trainer' };
      }

      await addTrainerToOrganization(orgId, existingUser._id, existingUser.email);

      // Only add TRAINER role if the user doesn't already have it
      if (!existingUser.role.includes(SystemRoles.TRAINER)) {
        const role = Array.isArray(existingUser.role) ? existingUser.role : [existingUser.role];
        await updateUser(existingUser._id, {
          role: [...role, SystemRoles.TRAINER],
        });
      }

      logger.info(
        `[processTrainers] User ${email} has been granted trainer role for organization ${orgName}`,
      );

      await sendTrainerNotificationEmail(existingUser, orgName);
    } else {
      // User doesn't exist, generate invitation token
      const { token } = await createTrainerInvitation(email, orgId);

      // Send invitation email
      await sendTrainerInvitationEmail(email, token, orgName);
    }
  }
  return { result: true };
};

/**
 * Send notification email to existing user who is added as a trainer
 * @param {Object} user - User object with email, name, and username
 * @param {string} orgName - The name of the training organization
 * @returns {Promise<void>}
 */
const sendTrainerNotificationEmail = async (user, orgName) => {
  try {
    const loginLink = `${process.env.DOMAIN_CLIENT}/login`;

    if (!checkEmailConfig()) {
      logger.info(
        `[sendTrainerNotificationEmail] Email configuration not available. Cannot send notification to [Email: ${user.email}] [Org: ${orgName}] [loginLink: ${loginLink}]`,
      );
      return;
    }

    await sendEmail({
      email: user.email,
      subject: `You are now a trainer of ${orgName}`,
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: user.name || user.username || user.email,
        orgName,
        loginLink,
      },
      template: 'trainerNotification.handlebars',
    });

    logger.info(
      `[sendTrainerNotificationEmail] Trainer notification sent. [Email: ${user.email}] [Org: ${orgName}] [loginLink: ${loginLink}]`,
    );
  } catch (error) {
    logger.error(`[sendTrainerNotificationEmail] Error sending notification: ${error.message}`);
  }
};

/**
 * Send invitation email to new trainer
 * @param {string} email - The email address to send the invitation to
 * @param {string} token - The invitation token
 * @param {string} orgName - The name of the training organization
 * @returns {Promise<void>}
 */
const sendTrainerInvitationEmail = async (email, token, orgName) => {
  try {
    const inviteLink = `${process.env.DOMAIN_CLIENT}/trainer-invite?token=${token}&email=${encodeURIComponent(email)}&orgName=${encodeURIComponent(orgName)}`;

    if (!checkEmailConfig()) {
      logger.info(
        `[sendTrainerInvitationEmail] Email configuration not available. Cannot send invitation to [Email: ${email}] [Org: ${orgName}] [inviteLink: ${inviteLink}]`,
      );
      return;
    }

    await sendEmail({
      email,
      subject: `Invitation to join ${orgName} as a trainer`,
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: email,
        orgName: orgName,
        inviteLink,
      },
      template: 'trainerInvite.handlebars',
    });

    logger.info(
      `[sendTrainerInvitationEmail] Invitation sent. [Email: ${email}] [Org: ${orgName}] [inviteLink: ${inviteLink}]`,
    );
  } catch (error) {
    logger.error(`[sendTrainerInvitationEmail] Error sending invitation: ${error.message}`);
  }
};

/**
 * Delete a user from all training organizations where he is an administrator or trainer
 * @param {string} userId - The ID of the user to remove
 * @returns {Promise<void>}
 */
const deleteUserFromOrganizations = async (userId) => {
  try {
    // Find all organizations where the user is an administrator
    const adminOrgs = await findTrainingOrganizationsByAdmin(userId);

    // Find all organizations where the user is a trainer
    const trainerOrgs = await findTrainingOrganizationsByTrainer(userId);

    // Remove user from administrators in all organizations
    for (const org of adminOrgs) {
      await removeAdminFromOrganization(org._id, userId);
      logger.info(
        `[deleteUserFromOrganizations] User ${userId} removed as administrator from organization ${org._id} (${org.name})`,
      );
    }

    // Remove user from trainers in all organizations
    for (const org of trainerOrgs) {
      await removeTrainerFromOrganization(org._id, userId);
      logger.info(
        `[deleteUserFromOrganizations] User ${userId} removed as trainer from organization ${org._id} (${org.name})`,
      );
    }

    logger.info(
      `[deleteUserFromOrganizations] User ${userId} removed from ${adminOrgs.length} organizations as administrator and ${trainerOrgs.length} organizations as trainer`,
    );
  } catch (error) {
    logger.error(
      `[deleteUserFromOrganizations] Error removing user ${userId} from organizations: ${error.message}`,
    );
    throw error;
  }
};

module.exports = {
  processAdministrators,
  processTrainers,
  sendOrgAdminNotificationEmail,
  sendOrgAdminInvitationEmail,
  sendTrainerNotificationEmail,
  sendTrainerInvitationEmail,
  deleteUserFromOrganizations,
};
