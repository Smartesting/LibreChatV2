const {
  findUser,
  updateUser,
  findAdminInvitationByEmail,
  createAdminInvitation,
} = require('~/models');
const { sendEmail } = require('~/server/utils');
const { checkEmailConfig } = require('@librechat/api');
const { logger } = require('~/config');
const { SystemRoles } = require('librechat-data-provider');

/**
 * Grant admin access
 * @param {string} email - The email of the new admin
 * @returns {Promise<Object>} - The result of the grant access process
 */
const processGrantAdminAccess = async (email) => {
  try {
    // Check if email is valid
    if (!email || !email.match(/\S+@\S+\.\S+/)) {
      return {
        success: false,
        status: 400,
        message: 'Invalid email address',
      };
    }

    // Check if user already exists
    const existingUser = await findUser({ email }, 'email _id role');

    if (existingUser) {
      // If user already exists and already has ADMIN role, return an error
      if (existingUser.role.includes(SystemRoles.ADMIN)) {
        return {
          success: false,
          status: 400,
          message: 'User already has admin role',
        };
      }

      // If user already exists and has TRAINEE role, return an error
      if (existingUser.role.includes(SystemRoles.TRAINEE)) {
        return {
          success: false,
          status: 400,
          message: 'Trainee user cannot have admin role',
        };
      }

      const role = Array.isArray(existingUser.role) ? existingUser.role : [existingUser.role];
      const updatedUser = await updateUser(existingUser._id, {
        role: [...role, SystemRoles.ADMIN],
      });

      if (!updatedUser) {
        return {
          success: false,
          status: 500,
          message: 'Failed to update user role',
        };
      }

      logger.info(`User ${email} has been granted admin role`);

      // Send notification email to the user
      await sendNotificationEmail(email);

      return {
        success: true,
        status: 200,
        message: 'Admin role granted successfully',
        user: updatedUser,
      };
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await findAdminInvitationByEmail(email);

    if (existingInvitation) {
      return {
        success: false,
        status: 400,
        message: 'An invitation has already been sent to this email',
      };
    }

    // Create a new invitation
    const { invitation, token } = await createAdminInvitation(email);

    // Send invitation email
    await sendAdminInvitationEmail(email, token);

    return {
      success: true,
      status: 201,
      message: 'Invitation sent successfully',
      invitation,
    };
  } catch (error) {
    logger.error('[processGrantAdminAccess] Error processing admin invitation', error);
    return {
      success: false,
      status: 500,
      message: 'Error processing invitation',
    };
  }
};

/**
 * Send invitation email to new admin
 * @param {string} email - The email address to send the invitation to
 * @param {string} token - The invitation token
 * @returns {Promise<void>}
 */
const sendAdminInvitationEmail = async (email, token) => {
  try {
    const inviteLink = `${process.env.DOMAIN_CLIENT}/admin-invite?token=${token}&email=${encodeURIComponent(email)}`;

    // Check if email configuration is available
    if (!checkEmailConfig()) {
      logger.info(
        `[sendAdminInvitationEmail] Email configuration not available. Cannot send invitation to [Email: ${email}] [inviteLink: ${inviteLink}]`,
      );
      return;
    }

    await sendEmail({
      email,
      subject: 'Invitation to join as an Administrator',
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: email,
        inviteLink,
      },
      template: 'adminInvite.handlebars',
    });

    logger.info(
      `[sendAdminInvitationEmail] Invitation sent. [Email: ${email}] [inviteLink: ${inviteLink}]`,
    );
  } catch (error) {
    logger.error(`[sendAdminInvitationEmail] Error sending invitation: ${error.message}`);
  }
};

/**
 * Send notification email to existing user who has been granted admin access
 * @param {string} email - The email address to send the notification to
 * @returns {Promise<void>}
 */
const sendNotificationEmail = async (email) => {
  try {
    const loginLink = `${process.env.DOMAIN_CLIENT}/login`;

    // Check if email configuration is available
    if (!checkEmailConfig()) {
      logger.info(
        `[sendNotificationEmail] Email configuration not available. Cannot send notification to [Email: ${email}]`,
      );
      return;
    }

    await sendEmail({
      email,
      subject: 'You have been granted Administrator access',
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: email,
        loginLink,
      },
      template: 'adminNotification.handlebars',
    });

    logger.info(`[sendNotificationEmail] Notification sent. [Email: ${email}]`);
  } catch (error) {
    logger.error(`[sendNotificationEmail] Error sending notification: ${error.message}`);
  }
};

module.exports = {
  processGrantAdminAccess,
};
