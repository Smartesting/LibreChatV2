import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { invitationSchema } from '@librechat/data-schemas';
import { webcrypto } from 'node:crypto';
import { logger } from '~/index';

const Invitation = mongoose.model('Invitation', invitationSchema);

export function createInvitationMethods(mongoose: typeof import('mongoose')) {
  /**
   * Creates a new admin invitation
   * @param {string} email - The email to invite
   * @returns {Promise<Object>} - The created invitation and the plain token
   */
  const createAdminInvitation = async (email) => {
    try {
      // Generate a random token
      const token = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('hex');
      const tokenHash = bcrypt.hashSync(token, 10);

      const existingInvitation = await Invitation.findOne({ email });
      let invitation;

      if (existingInvitation) {
        // Update the existing invitation
        invitation = await Invitation.findOneAndUpdate(
          { email },
          {
            $set: {
              'roles.superAdmin': true,
            },
            $push: {
              invitationTokens: tokenHash,
            },
          },
          { new: true },
        );
      } else {
        // Create the invitation
        invitation = await Invitation.create({
          email,
          invitationTokens: [tokenHash],
          roles: {
            superAdmin: true,
            orgAdmin: [],
            orgTrainer: [],
          },
        });
      }

      return { invitation, token };
    } catch (error) {
      logger.error('[createAdminInvitation] Error creating admin invitation', error);
      throw error;
    }
  };

  /**
   * Creates a new org admin invitation
   * @param {string} email - The email to invite
   * @param {string} orgId - The organization ID
   * @returns {Promise<Object>} - The created invitation and the plain token
   */
  const createOrgAdminInvitation = async (email, orgId) => {
    try {
      // Generate a random token
      const token = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('hex');
      const tokenHash = bcrypt.hashSync(token, 10);

      const existingInvitation = await Invitation.findOne({ email });
      let invitation;

      if (existingInvitation) {
        // Update the existing invitation
        invitation = await Invitation.findOneAndUpdate(
          { email },
          {
            $push: {
              'roles.orgAdmin': orgId,
              invitationTokens: tokenHash,
            },
          },
          { new: true },
        );
      } else {
        // Create the invitation
        invitation = await Invitation.create({
          email,
          invitationTokens: [tokenHash],
          roles: {
            superAdmin: false,
            orgAdmin: [orgId],
            orgTrainer: [],
          },
        });
      }

      return { invitation, token };
    } catch (error) {
      logger.error('[createOrgAdminInvitation] Error creating org admin invitation', error);
      throw error;
    }
  };

  /**
   * Creates a new trainer invitation
   * @param {string} email - The email to invite
   * @param {string} orgId - The organization ID
   * @returns {Promise<Object>} - The created invitation and the plain token
   */
  const createTrainerInvitation = async (email, orgId) => {
    try {
      // Generate a random token
      const token = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('hex');
      const tokenHash = bcrypt.hashSync(token, 10);

      const existingInvitation = await Invitation.findOne({ email });
      let invitation;

      if (existingInvitation) {
        // Update the existing invitation
        invitation = await Invitation.findOneAndUpdate(
          { email },
          {
            $push: {
              'roles.orgTrainer': orgId,
              invitationTokens: tokenHash,
            },
          },
          { new: true },
        );
      } else {
        // Create the invitation
        invitation = await Invitation.create({
          email,
          invitationTokens: [tokenHash],
          roles: {
            superAdmin: false,
            orgAdmin: [],
            orgTrainer: [orgId],
          },
        });
      }

      return { invitation, token };
    } catch (error) {
      logger.error('[createOrgAdminInvitation] Error creating org admin invitation', error);
      throw error;
    }
  };

  /**
   * Finds an admin invitation by email
   * @param {string} email - The email to search for
   * @returns {Promise<Object|null>} - The found invitation or null if not found
   */
  const findAdminInvitationByEmail = async (email) => {
    try {
      return await Invitation.findOne({
        email,
        'roles.superAdmin': true,
      });
    } catch (error) {
      logger.error('[findAdminInvitationByEmail] Error finding pending admin invitation', error);
      throw error;
    }
  };

  /**
   * Finds an invitation by email and token
   * @param {string} email - The email to search for
   * @param {string} token - The plain token to verify
   * @returns {Promise<Object|null>} - The found invitation or null if not found
   */
  const findInvitationByEmailAndToken = async (email, token) => {
    try {
      const invitation = await Invitation.findOne({
        email,
      });

      if (!invitation || !invitation.invitationTokens) {
        return null;
      }

      // Verify the token using bcrypt
      const validToken = invitation.invitationTokens.find((invitationToken) =>
        bcrypt.compareSync(token, invitationToken),
      );

      if (!validToken) {
        return null;
      }

      return invitation;
    } catch (error) {
      logger.error('[findInvitationByEmailAndToken] Error finding invitation', error);
      throw error;
    }
  };

  /**
   * Delete an invitation by its ID
   * @param {string} invitationId - The ID of the invitation to delete
   * @throws {Error} If deletion fails
   */
  const deleteInvitationById = async (invitationId) => {
    try {
      await Invitation.deleteOne({ _id: invitationId });
    } catch (error) {
      logger.error('[deleteInvitationById] Error deleting invitation', error);
      throw error;
    }
  };

  /**
   * Find all organization admin invitations for a specific organization
   * @param {string} orgId - The organization ID to search for
   * @returns {Promise<Array>} Array of matching invitation documents
   * @throws {Error} If query fails
   */
  const findOrgAdminInvitationsByOrgId = async (orgId) => {
    try {
      return await Invitation.find({
        'roles.orgAdmin': orgId,
      });
    } catch (error) {
      logger.error('[findOrgAdminInvitationsByOrgId] Error finding org admin invitation', error);
    }
  };

  /**
   * Find all trainer invitations for a specific organization
   * @param {string} orgId - The organization ID to search for
   * @returns {Promise<Array>} Array of matching invitation documents
   * @throws {Error} If query fails
   */
  const findTrainerInvitationsByOrgId = async (orgId) => {
    try {
      return await Invitation.find({
        'roles.orgTrainer': orgId,
      });
    } catch (error) {
      logger.error('[findTrainerInvitationsByOrgId] Error finding org trainer invitation', error);
    }
  };

  /**
   * Finds all admin invitations
   * @returns {Promise<Array>} - Array of admin invitations
   */
  const findAllAdminInvitations = async () => {
    try {
      return await Invitation.find({
        'roles.superAdmin': true,
      });
    } catch (error) {
      logger.error('[findAllAdminInvitations] Error finding admin invitations', error);
      throw error;
    }
  };

  /**
   * Removes the admin role from an invitation and deletes it if orgAdmin and orgTrainer are empty
   * @param {string} invitationId - The ID of the invitation to update
   * @returns {Promise<Object>} - Result object with success status and message
   */
  const removeAdminRoleFromInvitation = async (invitationId) => {
    try {
      // Update the invitation to remove admin role
      const updatedInvitation = await Invitation.findByIdAndUpdate(
        invitationId,
        {
          $set: {
            'roles.superAdmin': false,
          },
        },
        { new: true },
      );

      // Check if orgAdmin and orgTrainer are empty
      if (
        updatedInvitation.roles.orgAdmin.length === 0 &&
        updatedInvitation.roles.orgTrainer.length === 0
      ) {
        // Delete the invitation if both are empty
        await deleteInvitationById(invitationId);
      }
    } catch (error) {
      logger.error('[removeAdminRoleFromInvitation] Error updating invitation', error);
      throw error;
    }
  };

  /**
   * Removes the orgAdmin role for a specific organization from an invitation and deletes it if orgAdmin and orgTrainer are empty and superAdmin is false
   * @param {string} invitationId - The ID of the invitation to update
   * @param {string} orgId - The organization ID to remove from orgAdmin array
   * @returns {Promise<Object>} - Result object with success status and message
   */
  const removeOrgAdminRoleFromInvitation = async (invitationId, orgId) => {
    try {
      // Update the invitation to remove the orgId from orgAdmin array
      const updatedInvitation = await Invitation.findByIdAndUpdate(
        invitationId,
        {
          $pull: {
            'roles.orgAdmin': orgId,
          },
        },
        { new: true },
      );

      // Check if orgAdmin and orgTrainer are empty and superAdmin is false
      if (
        !updatedInvitation.roles.superAdmin &&
        updatedInvitation.roles.orgAdmin.length === 0 &&
        updatedInvitation.roles.orgTrainer.length === 0
      ) {
        // Delete the invitation if all role fields are empty
        await deleteInvitationById(invitationId);
      }
    } catch (error) {
      logger.error('[removeOrgAdminRoleFromInvitation] Error updating invitation', error);
      throw error;
    }
  };

  /**
   * Removes the orgTrainer role for a specific organization from an invitation and deletes it if orgAdmin and orgTrainer are empty and superAdmin is false
   * @param {string} invitationId - The ID of the invitation to update
   * @param {string} orgId - The organization ID to remove from orgTrainer array
   * @returns {Promise<Object>} - Result object with success status and message
   */
  const removeTrainerRoleFromInvitation = async (invitationId, orgId) => {
    try {
      // Update the invitation to remove the orgId from orgTrainer array
      const updatedInvitation = await Invitation.findByIdAndUpdate(
        invitationId,
        {
          $pull: {
            'roles.orgTrainer': orgId,
          },
        },
        { new: true },
      );

      // Check if orgAdmin and orgTrainer are empty and superAdmin is false
      if (
        !updatedInvitation.roles.superAdmin &&
        updatedInvitation.roles.orgAdmin.length === 0 &&
        updatedInvitation.roles.orgTrainer.length === 0
      ) {
        // Delete the invitation if all role fields are empty
        await deleteInvitationById(invitationId);
      }
    } catch (error) {
      logger.error('[removeTrainerRoleFromInvitation] Error updating invitation', error);
      throw error;
    }
  };

  return {
    createAdminInvitation,
    createOrgAdminInvitation,
    createTrainerInvitation,
    findAdminInvitationByEmail,
    findInvitationByEmailAndToken,
    deleteInvitationById,
    findOrgAdminInvitationsByOrgId,
    findTrainerInvitationsByOrgId,
    findAllAdminInvitations,
    removeAdminRoleFromInvitation,
    removeOrgAdminRoleFromInvitation,
    removeTrainerRoleFromInvitation,
  };
}

export type InvitationMethods = ReturnType<typeof createInvitationMethods>;
