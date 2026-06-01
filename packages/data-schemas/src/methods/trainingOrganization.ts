import mongoose from 'mongoose';
import { trainingOrganizationSchema } from '@librechat/data-schemas';
import { SystemRoles } from 'librechat-data-provider';
import { logger } from '~/index';

const TrainingOrganization = mongoose.model('trainingOrganization', trainingOrganizationSchema);

export function createTrainingOrganizationMethods(mongoose: typeof import('mongoose')) {
  /**
   * Create a training organization with the provided data.
   * @param {Object} trainingOrgData - The training organization data to create.
   * @returns {Promise<TrainingOrganization>} The created training organization document as a plain object.
   * @throws {Error} If the creation of the training organization fails.
   */
  const createTrainingOrganization = async (trainingOrgData) => {
    return (await TrainingOrganization.create(trainingOrgData)).toObject();
  };

  /**
   * Get all training organizations that the user can administer.
   * @param {Object} [user] - The user object. If provided, returns only organizations the user can administer.
   * @returns {Promise<TrainingOrganization[]>} A promise that resolves to an array of training organizations.
   */
  const getListTrainingOrganizations = async (user) => {
    if (!user || user.role.includes(SystemRoles.ADMIN)) {
      return TrainingOrganization.find({}).lean();
    }

    if (user.role.includes(SystemRoles.ORGADMIN)) {
      return TrainingOrganization.find({
        administrators: user._id,
      }).lean();
    }

    return [];
  };

  /**
   * Delete a training organization by ID
   * @param {string} orgId - The ID of the training organization to delete
   * @returns {Promise<Object|null>} The deleted training organization document or null if not found
   */
  const deleteTrainingOrganization = async (orgId) => {
    return TrainingOrganization.findByIdAndDelete(orgId).lean();
  };

  /**
   * Get a training organization by ID
   * @param {string} orgId - The ID of the training organization to retrieve
   * @returns {Promise<Object|null>} The training organization document or null if not found
   */
  const getTrainingOrganizationById = async (orgId) => {
    return TrainingOrganization.findById(orgId).lean();
  };

  /**
   * Add a new administrator to a training organization
   * @param {string} orgId - The ID of the training organization
   * @param {string} userId - The user ID of the administrator to add
   * @param {string} userEmail - The email of the administrator to add
   * @returns {Promise<Object|null>} The updated training organization document or null if error occurs
   */
  const addAdminToOrganization = async (orgId, userId, userEmail) => {
    try {
      return await TrainingOrganization.findOneAndUpdate(
        { _id: orgId },
        {
          $addToSet: {
            administrators: userId,
          },
        },
      );
    } catch (error) {
      logger.error(
        `[addAdminToOrganization] Error adding user ${userEmail} as admin to organization ${orgId}:`,
        error,
      );
      throw error;
    }
  };

  /**
   * Add a new trainer to a training organization
   * @param {string} orgId - The ID of the training organization
   * @param {string} userId - The user ID of the trainer to add
   * @param {string} userEmail - The email of the trainer to add
   * @returns {Promise<Object|null>} The updated training organization document or null if error occurs
   */
  const addTrainerToOrganization = async (orgId, userId, userEmail) => {
    try {
      return await TrainingOrganization.findOneAndUpdate(
        { _id: orgId },
        {
          $addToSet: {
            trainers: userId,
          },
        },
      );
    } catch (error) {
      logger.error(
        `[addTrainerToOrganization] Error adding user ${userEmail} as trainer to organization ${orgId}:`,
        error,
      );
      throw error;
    }
  };

  /**
   * Remove an administrator from a training organization
   * @param {string} orgId - The ID of the training organization
   * @param {string} userId - The ID of the administrator to remove
   * @returns {Promise<Object|null>} The updated training organization document or null if error occurs
   */
  const removeAdminFromOrganization = async (orgId, userId) => {
    try {
      return await TrainingOrganization.findOneAndUpdate(
        { _id: orgId },
        {
          $pull: {
            administrators: userId,
          },
        },
        { new: true },
      );
    } catch (error) {
      logger.error(
        `[removeAdminFromOrganization] Error removing user ${userId} as admin from organization ${orgId}:`,
        error,
      );
      throw error;
    }
  };

  /**
   * Remove a trainer from a training organization
   * @param {string} orgId - The ID of the training organization
   * @param {string} userId - The ID of the trainer to remove
   * @returns {Promise<Object|null>} The updated training organization document or null if error occurs
   */
  const removeTrainerFromOrganization = async (orgId, userId) => {
    try {
      return await TrainingOrganization.findOneAndUpdate(
        { _id: orgId },
        {
          $pull: {
            trainers: userId,
          },
        },
        { new: true },
      );
    } catch (error) {
      logger.error(
        `[removeTrainerFromOrganization] Error removing user ${userId} as trainer from organization ${orgId}:`,
        error,
      );
      throw error;
    }
  };

  const findTrainingOrganizationsByAdmin = async (adminId) => {
    try {
      return await TrainingOrganization.find({ administrators: adminId }).lean();
    } catch (error) {
      logger.error(
        `[findTrainingOrganizationsByAdmin] Error finding training organization where user ${adminId} is admin`,
        error,
      );
      throw error;
    }
  };

  const findTrainingOrganizationsByTrainer = async (trainerId) => {
    try {
      return await TrainingOrganization.find({ trainers: trainerId }).lean();
    } catch (error) {
      logger.error(
        `[findTrainingOrganizationsByTrainer] Error finding training organization where user ${trainerId} is trainer`,
        error,
      );
      throw error;
    }
  };

  return {
    TrainingOrganization,
    createTrainingOrganization,
    getListTrainingOrganizations,
    deleteTrainingOrganization,
    getTrainingOrganizationById,
    addAdminToOrganization,
    addTrainerToOrganization,
    removeAdminFromOrganization,
    removeTrainerFromOrganization,
    findTrainingOrganizationsByAdmin,
    findTrainingOrganizationsByTrainer,
  };
}

export type TrainingOrganizationMethods = ReturnType<typeof createTrainingOrganizationMethods>;
