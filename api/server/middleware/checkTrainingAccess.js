const { SystemRoles } = require('librechat-data-provider');
const { getOngoingTrainings, updateTraining } = require('~/models');

async function checkTrainingAccess(req, res, next) {
  const { role, _id, email } = req.user;

  try {
    if (role.some((userRole) => [SystemRoles.ADMIN, SystemRoles.ORGADMIN].includes(userRole))) {
      return next();
    }

    if (role.some((userRole) => [SystemRoles.TRAINER, SystemRoles.TRAINEE].includes(userRole))) {
      const ongoingTrainings = await getOngoingTrainings();

      if (!ongoingTrainings || ongoingTrainings.length === 0) {
        return res.status(403).json({ message: 'no_ongoing_training' });
      }

      let matchingTrainings = [];
      const hasAccess = ongoingTrainings.some((training) => {
        if (role.includes(SystemRoles.TRAINER)) {
          return training.trainers?.some((trainerId) => trainerId.equals(_id));
        }

        if (role.includes(SystemRoles.TRAINEE)) {
          const match = training.trainees?.some((trainee) => trainee.username === email);
          if (match) {
            matchingTrainings.push(training);
          }
          return match;
        }

        return false;
      });

      for (const training of matchingTrainings) {
        training.trainees =
          training.trainees.map((trainee) =>
            trainee.username === email ? { ...trainee, hasLoggedIn: true } : trainee,
          ) ?? [];
        await updateTraining(training._id, training);
      }

      if (!hasAccess) {
        return res.status(403).json({ message: 'no_ongoing_training' });
      }
      return next();
    }

    return res.status(403).json({ message: 'no_ongoing_training' });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
}

module.exports = checkTrainingAccess;
