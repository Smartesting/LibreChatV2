const { logger } = require('~/config');
const { SystemRoles } = require('librechat-data-provider');
const {
  updateUser,
  createTrainingOrganization,
  getListTrainingOrganizations,
  deleteTrainingOrganization,
  getTrainingOrganizationById,
  removeAdminFromOrganization,
  removeTrainerFromOrganization,
  findTrainingOrganizationsByAdmin,
  findTrainingOrganizationsByTrainer,
  findTrainerInvitationsByOrgId,
  findOrgAdminInvitationsByOrgId,
  removeOrgAdminRoleFromInvitation,
  removeTrainerRoleFromInvitation,
  getTrainingsByOrganization,
  deleteTraining,
} = require('~/models');
const {
  processAdministrators,
  processTrainers,
} = require('~/server/services/TrainingOrganizationService');

/**
 * Creates a training organization.
 * @route POST /training-organizations
 * @param {ServerRequest} req - The request object.
 * @param {TrainingOrganizationCreateParams} req.body - The request body.
 * @param {ServerResponse} res - The response object.
 * @returns {TrainingOrganization} 201 - success response - application/json
 */
const createTrainingOrganizationHandler = async (req, res) => {
  try {
    const { name, administrators } = req.body;

    // Check if a training organization with the same name already exists
    const existingOrganizations = await getListTrainingOrganizations();
    const existingOrg = existingOrganizations.find(
      (org) => org.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingOrg) {
      return res
        .status(400)
        .json({ error: 'A training organization with this name already exists' });
    }

    // Create the training organization with processed administrators
    const trainingOrganization = await createTrainingOrganization({
      name,
    });

    // Process administrators (check if they exist, remove duplicates, generate tokens, send emails)
    await processAdministrators(administrators, trainingOrganization._id, name);

    res.status(201).json(trainingOrganization);
  } catch (error) {
    logger.error('[/training-organizations] Error creating training organization', error);

    // Check if it's a validation error (Mongoose ValidationError)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves all training organizations that the user can administer.
 * @route GET /training-organizations
 * @param {object} req - Express Request
 * @param {ServerResponse} res - The response object.
 * @returns {Promise<TrainingOrganization[]>} 200 - success response - application/json
 */
const getListTrainingOrganizationsHandler = async (req, res) => {
  try {
    const trainingOrganizations = await getListTrainingOrganizations(req.user);
    return res.json(trainingOrganizations);
  } catch (error) {
    logger.error('[/training-organizations] Error listing training organizations', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Deletes a training organization by ID.
 * @route DELETE /training-organizations/:organizationId
 * @param {ServerRequest} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.id - The ID of the training organization to delete.
 * @param {ServerResponse} res - The response object.
 * @returns {Object} 200 - success response - application/json
 */
const deleteTrainingOrganizationHandler = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization ID' });
    }

    const trainings = await getTrainingsByOrganization(organizationId);

    for (const training of trainings) {
      await deleteTraining(training._id);
      logger.info(
        `Deleted training ${training._id} associated with organization ${organizationId}`,
      );
    }

    const deletedOrg = await deleteTrainingOrganization(organizationId);

    if (!deletedOrg) {
      return res.status(404).json({ error: 'Training organization not found' });
    }

    for (const admin of deletedOrg.administrators) {
      await removeOrgAdminRoleIfNecessary(admin);
    }

    for (const trainer of deletedOrg.trainers) {
      await removeTrainerRoleIfNecessary(trainer);
    }

    res.status(204).send();
  } catch (error) {
    logger.error(
      `[/training-organizations/${req.params.organizationId}] Error deleting training organization`,
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves a training organization by ID.
 * @route GET /training-organizations/:organizationId
 * @param {ServerRequest} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.id - The ID of the training organization to retrieve.
 * @param {ServerResponse} res - The response object.
 * @returns {Promise<TrainingOrganization>} 200 - success response - application/json
 */
const getTrainingOrganizationByIdHandler = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization ID' });
    }

    const trainingOrganization = await getTrainingOrganizationById(organizationId);

    if (!trainingOrganization) {
      return res.status(404).json({ error: 'Training organization not found' });
    }

    return res.json(trainingOrganization);
  } catch (error) {
    logger.error(
      `[/training-organizations/${req.params.organizationId}] Error retrieving training organization`,
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

/**
 * Adds an administrator to a training organization.
 * @route POST /training-organizations/:organizationId/administrators
 * @param {ServerRequest} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.id - The ID of the training organization.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The email of the administrator to add.
 * @param {ServerResponse} res - The response object.
 * @returns {Object} 200 - success response - application/json
 */
const addAdministratorHandler = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { email } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization ID' });
    }

    if (!email || !email.match(/\S+@\S+\.\S+/)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const trainingOrganization = await getTrainingOrganizationById(organizationId);
    if (!trainingOrganization) {
      return res.status(404).json({ error: 'Training organization not found' });
    }

    const existingAdmin = trainingOrganization.administrators.find(
      (admin) => admin.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingAdmin) {
      return res.status(400).json({ error: 'Administrator already exists in this organization' });
    }

    const adminInvitations = await findOrgAdminInvitationsByOrgId(organizationId);
    const existingInvitation = adminInvitations.find(
      (invitation) => invitation.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingInvitation) {
      return res.status(400).json({ error: 'Administrator already invited in this organization' });
    }

    await processAdministrators([email], organizationId, trainingOrganization.name);

    const updatedOrg = await getTrainingOrganizationById(organizationId);

    if (!updatedOrg) {
      return res.status(500).json({ error: 'Failed to find updated training organization' });
    }

    res.status(200).json(updatedOrg);
  } catch (error) {
    logger.error(
      `[/training-organizations/${req.params.organizationId}/administrators] Error adding administrator`,
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

/**
 * Removes an administrator from a training organization.
 * @route DELETE /training-organizations/:organizationId/administrators/:email
 * @param {ServerRequest} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.id - The ID of the training organization.
 * @param {string} req.params.email - The email of the administrator to remove.
 * @param {ServerResponse} res - The response object.
 * @returns {Object} 200 - success response - application/json
 */
const removeAdministratorHandler = async (req, res) => {
  try {
    const { organizationId, email } = req.params;
    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization ID' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Missing administrator email' });
    }

    const trainingOrganization = await getTrainingOrganizationById(organizationId);
    if (!trainingOrganization) {
      return res.status(404).json({ error: 'Training organization not found' });
    }

    const existingAdmin = trainingOrganization.administrators.find(
      (admin) => admin.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingAdmin) {
      const updatedOrg = await removeAdminFromOrganization(organizationId, existingAdmin._id);

      if (updatedOrg) {
        await removeOrgAdminRoleIfNecessary(existingAdmin);
      }

      return res.status(200).json(updatedOrg);
    } else {
      // If user doesn't exist, check if there's an admin invitation
      const invitations = await findOrgAdminInvitationsByOrgId(trainingOrganization._id);
      const orgAdminInvitation = invitations.find(
        (invitation) => invitation.email.toLowerCase() === email.toLowerCase(),
      );

      if (orgAdminInvitation) {
        // Remove the org admin role from the invitation
        await removeOrgAdminRoleFromInvitation(orgAdminInvitation._id, trainingOrganization._id);
        logger.info(
          `Org admin role removed from invitation for ${email} on ${trainingOrganization.name} organization`,
        );
        return res.status(200).json(trainingOrganization);
      } else {
        return res.status(404).json({ error: 'User not found and no pending invitation exists' });
      }
    }
  } catch (error) {
    logger.error(
      `[/training-organizations/${req.params.organizationId}/administrators/${req.params.email}] Error removing administrator`,
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

/**
 * Adds a trainer to a training organization.
 * @route POST /training-organizations/:organizationId/trainers
 * @param {ServerRequest} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.id - The ID of the training organization.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The email of the trainer to add.
 * @param {ServerResponse} res - The response object.
 * @returns {Object} 200 - success response - application/json
 */
const addTrainerHandler = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { email } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization ID' });
    }

    if (!email || !email.match(/\S+@\S+\.\S+/)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const trainingOrganization = await getTrainingOrganizationById(organizationId);

    if (!trainingOrganization) {
      return res.status(404).json({ error: 'Training organization not found' });
    }

    const existingTrainer = trainingOrganization.trainers.find(
      (trainer) => trainer.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingTrainer) {
      return res.status(400).json({ error: 'Trainer already exists in this organization' });
    }

    const trainerInvitations = await findTrainerInvitationsByOrgId(organizationId);
    const existingInvitation = trainerInvitations.find(
      (invitation) => invitation.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingInvitation) {
      return res.status(400).json({ error: 'Trainer already invited in this organization' });
    }

    const result = await processTrainers([email], organizationId, trainingOrganization.name);
    if (result && result.result === false) {
      return res.status(result.errorCode).json({ error: result.errorMsg });
    }

    const updatedOrg = await getTrainingOrganizationById(organizationId);

    if (!updatedOrg) {
      return res.status(500).json({ error: 'Failed to find updated training organization' });
    }

    res.status(200).json(updatedOrg);
  } catch (error) {
    logger.error(
      `[/training-organizations/${req.params.organizationId}/trainers] Error adding trainer`,
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

/**
 * Removes a trainer from a training organization.
 * @route DELETE /training-organizations/:organizationId/trainers/:email
 * @param {ServerRequest} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.id - The ID of the training organization.
 * @param {string} req.params.email - The email of the trainer to remove.
 * @param {ServerResponse} res - The response object.
 * @returns {Object} 200 - success response - application/json
 */
const removeTrainerHandler = async (req, res) => {
  try {
    const { organizationId, email } = req.params;
    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organization ID' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Missing trainer email' });
    }

    const trainingOrganization = await getTrainingOrganizationById(organizationId);
    if (!trainingOrganization) {
      return res.status(404).json({ error: 'Training organization not found' });
    }

    const existingTrainer = trainingOrganization.trainers.find(
      (trainer) => trainer.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingTrainer) {
      const updatedOrg = await removeTrainerFromOrganization(organizationId, existingTrainer._id);

      if (updatedOrg) {
        await removeTrainerRoleIfNecessary(existingTrainer);
      }

      return res.status(200).json(updatedOrg);
    } else {
      // If user doesn't exist, check if there's a trainer invitation
      const invitations = await findTrainerInvitationsByOrgId(trainingOrganization._id);
      const trainerInvitation = invitations.find(
        (invitation) => invitation.email.toLowerCase() === email.toLowerCase(),
      );

      if (trainerInvitation) {
        // Remove the trainer role from the invitation
        await removeTrainerRoleFromInvitation(trainerInvitation._id, trainingOrganization._id);
        logger.info(
          `Trainer role removed from invitation for ${email} on ${trainingOrganization.name} organization`,
        );
        return res.status(200).json(trainingOrganization);
      } else {
        return res
          .status(404)
          .json({ error: 'Trainer not found and no pending invitation exists' });
      }
    }
  } catch (error) {
    logger.error(
      `[/training-organizations/${req.params.organizationId}/trainers/${req.params.email}] Error removing trainer`,
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const removeOrgAdminRoleIfNecessary = async (user) => {
  const orgsWithUserAsAdmin = await findTrainingOrganizationsByAdmin(user._id);

  // If the user is not an administrator of any organization, remove the orgadmin role
  if (orgsWithUserAsAdmin.length === 0 && user.role.includes(SystemRoles.ORGADMIN)) {
    const role = Array.isArray(user.role) ? user.role : [user.role];
    await updateUser(user._id, {
      role: role.filter((role) => role !== SystemRoles.ORGADMIN),
    });
    logger.info(
      `Removed ${SystemRoles.ORGADMIN} role from user ${user.email} as he is no longer an administrator of any organization`,
    );
  }
};

const removeTrainerRoleIfNecessary = async (user) => {
  const orgsWithUserAsTrainer = await findTrainingOrganizationsByTrainer(user._id);

  // If the user is not a trainer in any organization, remove the trainer role
  if (orgsWithUserAsTrainer.length === 0 && user.role.includes(SystemRoles.TRAINER)) {
    const role = Array.isArray(user.role) ? user.role : [user.role];
    await updateUser(user._id, {
      role: role.filter((role) => role !== SystemRoles.TRAINER),
    });
    logger.info(
      `Removed ${SystemRoles.TRAINER} role from user ${user.email} as he is no longer a trainer in any organization`,
    );
  }
};

module.exports = {
  createTrainingOrganization: createTrainingOrganizationHandler,
  getListTrainingOrganizations: getListTrainingOrganizationsHandler,
  deleteTrainingOrganization: deleteTrainingOrganizationHandler,
  getTrainingOrganizationById: getTrainingOrganizationByIdHandler,
  addAdministrator: addAdministratorHandler,
  removeAdministrator: removeAdministratorHandler,
  addTrainer: addTrainerHandler,
  removeTrainer: removeTrainerHandler,
};
