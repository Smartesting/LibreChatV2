const {
  generateTraineeUsers,
  deleteUserById,
  findUser,
  createTraining,
  getTrainingsByOrganization,
  getTrainingById,
  updateTraining,
  deleteTraining,
  getOngoingTrainings,
  calculateTrainingStatus,
} = require('../../models');

/**
 * Create a new training
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const create = async (req, res) => {
  try {
    const trainingData = req.body;

    if (!trainingData.trainingOrganizationId) {
      return res.status(400).json({ error: 'Training organization ID is required' });
    }

    if (!trainingData.trainees) {
      trainingData.trainees = [];
    }

    if (trainingData.participantCount && Number(trainingData.participantCount) > 0) {
      const count = Number(trainingData.participantCount);

      const generatedUsers = await generateTraineeUsers(count, 0);

      const trainees = generatedUsers.map((user) => ({
        username: user.email,
        password: user.password,
        hasLoggedIn: false,
      }));

      trainingData.trainees = [...trainingData.trainees, ...trainees];
    }

    const training = await createTraining(trainingData);
    return res.status(201).json(training);
  } catch (error) {
    console.error('Error creating training:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get all trainings for a specific organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const getByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const trainings = await getTrainingsByOrganization(organizationId);
    const trainingsWithStatus = trainings.map((training) => {
      const status = calculateTrainingStatus(training.startDateTime, training.endDateTime);
      return { ...training, status };
    });

    return res.status(200).json(trainingsWithStatus);
  } catch (error) {
    console.error('Error getting trainings:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get a training by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const getById = async (req, res) => {
  try {
    const { trainingId } = req.params;

    if (!trainingId) {
      return res.status(400).json({ error: 'Training ID is required' });
    }

    const training = await getTrainingById(trainingId);

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    return res.status(200).json(training);
  } catch (error) {
    console.error('Error getting training:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update a training
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const update = async (req, res) => {
  try {
    const { trainingId } = req.params;
    const updateData = req.body;

    if (!trainingId) {
      return res.status(400).json({ error: 'Training ID is required' });
    }

    const currentTraining = await getTrainingById(trainingId);
    if (!currentTraining) {
      return res.status(404).json({ error: 'Training not found' });
    }
    if (!updateData.trainees) {
      updateData.trainees = currentTraining.trainees || [];
    }

    if (updateData.participantCount && Number(updateData.participantCount) > 0) {
      const currentParticipantsCount = currentTraining.participantCount;
      const newCount = Number(updateData.participantCount);
      if (newCount > currentParticipantsCount) {
        const newGeneratedUsers = await generateTraineeUsers(
          newCount - currentParticipantsCount,
          currentParticipantsCount,
        );
        const newTrainees = newGeneratedUsers.map((user) => ({
          username: user.email,
          password: user.password,
          hasLoggedIn: false,
        }));
        updateData.trainees = [...updateData.trainees, ...newTrainees];
      } else if (newCount < currentParticipantsCount) {
        for (const trainee of currentTraining.trainees.slice(newCount - currentParticipantsCount)) {
          const user = await findUser({ email: trainee.username });
          await deleteUserById(user._id);
        }
        updateData.trainees = currentTraining.trainees.slice(0, newCount);
      }
    } else if (Number(updateData.participantCount) === 0) {
      for (const trainee of currentTraining.trainees) {
        const user = await findUser({ email: trainee.username });
        await deleteUserById(user._id);
      }
      updateData.trainees = [];
    }

    const training = await updateTraining(trainingId, updateData);

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    return res.status(200).json(training);
  } catch (error) {
    console.error('Error updating training:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a training
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const remove = async (req, res) => {
  try {
    const { trainingId } = req.params;

    if (!trainingId) {
      return res.status(400).json({ error: 'Training ID is required' });
    }

    const trainingToDelete = await getTrainingById(trainingId);
    if (!trainingToDelete) {
      return res.status(404).json({ error: 'Training not found' });
    }

    for (const trainee of trainingToDelete.trainees) {
      const user = await findUser({ email: trainee.username });
      if (user) {
        await deleteUserById(user._id);
      }
    }

    const training = await deleteTraining(trainingId);
    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    return res.status(200).json({ message: 'Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting training:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Check if the current user is a trainer in any ongoing training
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with isTrainer boolean
 */
const isActiveTrainer = async (req, res) => {
  try {
    const { _id } = req.user;

    if (!_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const ongoingTrainings = await getOngoingTrainings();

    if (!ongoingTrainings || ongoingTrainings.length === 0) {
      return res.status(200).json({ isActiveTrainer: false });
    }

    const isUserTrainer = ongoingTrainings.some((training) =>
      training.trainers?.some((trainerId) => trainerId.equals(_id)),
    );

    return res.status(200).json({ isActiveTrainer: isUserTrainer });
  } catch (error) {
    console.error('Error checking trainer status:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  create,
  getByOrganization,
  getById,
  update,
  remove,
  isActiveTrainer,
};
