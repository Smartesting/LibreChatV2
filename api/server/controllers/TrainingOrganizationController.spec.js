// Set environment variables for testing
process.env.DOMAIN_CLIENT = 'http://localhost:3080';
process.env.APP_TITLE = 'LibreChat';

// Mock server/utils before requiring any modules that use it
jest.mock('../utils', () => ({
  sendEmail: jest.fn(),
  checkEmailConfig: jest.fn(),
}));

// Mock logger
jest.mock('~/config', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock TrainingOrganization model functions
jest.mock('~/models/TrainingOrganization', () => ({
  createTrainingOrganization: jest.fn(),
  getListTrainingOrganizations: jest.fn(),
  deleteTrainingOrganization: jest.fn(),
  getTrainingOrganizationById: jest.fn(),
  removeAdminFromOrganization: jest.fn(),
  removeTrainerFromOrganization: jest.fn(),
  TrainingOrganization: jest.fn(),
  findTrainingOrganizationsByAdmin: jest.fn(),
  findTrainingOrganizationsByTrainer: jest.fn(),
  addAdminToOrganization: jest.fn(),
  addTrainerToOrganization: jest.fn(),
}));

// Mock Training model functions
jest.mock('~/models/Training', () => ({
  getTrainingsByOrganization: jest.fn(),
  deleteTraining: jest.fn(),
}));

// Mock TrainingOrganizationService
jest.mock('../services/TrainingOrganizationService', () => ({
  processAdministrators: jest.fn(),
  processTrainers: jest.fn(),
}));

// Mock Invitation model functions
jest.mock('~/models/Invitation', () => ({
  findTrainerInvitationsByOrgId: jest.fn(),
  findOrgAdminInvitationsByOrgId: jest.fn(),
  removeOrgAdminRoleFromInvitation: jest.fn(),
  removeTrainerRoleFromInvitation: jest.fn(),
}));

// Mock updateUser
jest.mock('~/models', () => ({
  updateUser: jest.fn(),
}));

// Mock SystemRoles
jest.mock('librechat-data-provider', () => ({
  SystemRoles: {
    ADMIN: 'ADMIN',
    ORGADMIN: 'ORGADMIN',
    TRAINER: 'TRAINER',
  },
}));

// Import the controller functions
const {
  createTrainingOrganization,
  getListTrainingOrganizations,
  deleteTrainingOrganization,
  getTrainingOrganizationById,
  addAdministrator,
  removeAdministrator,
  addTrainer,
  removeTrainer,
} = require('./TrainingOrganizationController');

// Import mocked dependencies
const { logger } = require('~/config');
const { updateUser } = require('~/models');
const {
  createTrainingOrganization: createTrainingOrganizationMock,
  getListTrainingOrganizations: getListTrainingOrganizationsMock,
  deleteTrainingOrganization: deleteTrainingOrganizationMock,
  getTrainingOrganizationById: getTrainingOrganizationByIdMock,
  removeAdminFromOrganization: removeAdminFromOrganizationMock,
  removeTrainerFromOrganization: removeTrainerFromOrganizationMock,
  findTrainingOrganizationsByAdmin: findTrainingOrganizationsByAdminMock,
  findTrainingOrganizationsByTrainer: findTrainingOrganizationsByTrainerMock,
} = require('~/models/TrainingOrganization');
const {
  getTrainingsByOrganization: getTrainingsByOrganizationMock,
  deleteTraining: deleteTrainingMock,
} = require('~/models/Training');
const {
  processAdministrators,
  processTrainers,
} = require('../services/TrainingOrganizationService');
const {
  findTrainerInvitationsByOrgId,
  findOrgAdminInvitationsByOrgId,
  removeOrgAdminRoleFromInvitation,
  removeTrainerRoleFromInvitation,
} = require('~/models/Invitation');
const { SystemRoles } = require('librechat-data-provider');

describe('TrainingOrganizationController', () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup request and response objects
    req = {
      params: {},
      body: {},
      user: {
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER'],
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('createTrainingOrganization', () => {
    it('should create a training organization successfully', async () => {
      // Setup
      req.body = {
        name: 'Test Organization',
        administrators: ['admin@example.com'],
      };

      getListTrainingOrganizationsMock.mockResolvedValue([]);
      createTrainingOrganizationMock.mockResolvedValue({
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      });
      processAdministrators.mockResolvedValue();

      // Execute
      await createTrainingOrganization(req, res);

      // Assert
      expect(getListTrainingOrganizationsMock).toHaveBeenCalled();
      expect(createTrainingOrganizationMock).toHaveBeenCalledWith({
        name: 'Test Organization',
      });
      expect(processAdministrators).toHaveBeenCalledWith(
        ['admin@example.com'],
        'org-id',
        'Test Organization',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      });
    });

    it('should return 400 if organization with same name already exists', async () => {
      // Setup
      req.body = {
        name: 'Existing Organization',
        administrators: ['admin@example.com'],
      };

      getListTrainingOrganizationsMock.mockResolvedValue([
        {
          _id: 'existing-org-id',
          name: 'Existing Organization',
        },
      ]);

      // Execute
      await createTrainingOrganization(req, res);

      // Assert
      expect(getListTrainingOrganizationsMock).toHaveBeenCalled();
      expect(createTrainingOrganizationMock).not.toHaveBeenCalled();
      expect(processAdministrators).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'A training organization with this name already exists',
      });
    });

    it('should handle validation errors', async () => {
      // Setup
      req.body = {
        name: 'Test Organization',
        administrators: ['admin@example.com'],
      };

      getListTrainingOrganizationsMock.mockResolvedValue([]);
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      createTrainingOrganizationMock.mockRejectedValue(validationError);

      // Execute
      await createTrainingOrganization(req, res);

      // Assert
      expect(getListTrainingOrganizationsMock).toHaveBeenCalled();
      expect(createTrainingOrganizationMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Validation error' });
    });

    it('should handle general errors', async () => {
      // Setup
      req.body = {
        name: 'Test Organization',
        administrators: ['admin@example.com'],
      };

      getListTrainingOrganizationsMock.mockResolvedValue([]);
      createTrainingOrganizationMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await createTrainingOrganization(req, res);

      // Assert
      expect(getListTrainingOrganizationsMock).toHaveBeenCalled();
      expect(createTrainingOrganizationMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getListTrainingOrganizations', () => {
    it('should return all training organizations for admin user', async () => {
      // Setup
      req.user.role = ['USER', SystemRoles.ADMIN];
      const organizations = [
        { _id: 'org1', name: 'Organization 1' },
        { _id: 'org2', name: 'Organization 2' },
      ];
      getListTrainingOrganizationsMock.mockResolvedValue(organizations);

      // Execute
      await getListTrainingOrganizations(req, res);

      // Assert
      expect(getListTrainingOrganizationsMock).toHaveBeenCalledWith(req.user);
      expect(res.json).toHaveBeenCalledWith(organizations);
    });

    it('should handle errors', async () => {
      // Setup
      getListTrainingOrganizationsMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await getListTrainingOrganizations(req, res);

      // Assert
      expect(getListTrainingOrganizationsMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('deleteTrainingOrganization', () => {
    it('should delete a training organization and its associated trainings successfully', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      const trainings = [
        { _id: 'training-id-1', name: 'Training 1' },
        { _id: 'training-id-2', name: 'Training 2' },
      ];
      const deletedOrg = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [
          { _id: 'admin-id', email: 'admin@example.com', role: [SystemRoles.ORGADMIN] },
        ],
        trainers: [
          { _id: 'trainer-id', email: 'trainer@example.com', role: [SystemRoles.TRAINER] },
        ],
      };
      getTrainingsByOrganizationMock.mockResolvedValue(trainings);
      deleteTrainingMock.mockResolvedValue({});
      deleteTrainingOrganizationMock.mockResolvedValue(deletedOrg);
      findTrainingOrganizationsByAdminMock.mockResolvedValue([]);
      findTrainingOrganizationsByTrainerMock.mockResolvedValue([]);
      updateUser.mockResolvedValue({});

      // Execute
      await deleteTrainingOrganization(req, res);

      // Assert
      expect(getTrainingsByOrganizationMock).toHaveBeenCalledWith('org-id');
      expect(deleteTrainingMock).toHaveBeenCalledTimes(2);
      expect(deleteTrainingMock).toHaveBeenCalledWith('training-id-1');
      expect(deleteTrainingMock).toHaveBeenCalledWith('training-id-2');
      expect(deleteTrainingOrganizationMock).toHaveBeenCalledWith('org-id');
      expect(findTrainingOrganizationsByAdminMock).toHaveBeenCalledWith('admin-id');
      expect(findTrainingOrganizationsByTrainerMock).toHaveBeenCalledWith('trainer-id');
      expect(updateUser).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should delete a training organization with no associated trainings', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      const trainings = []; // No trainings associated with this organization
      const deletedOrg = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [
          { _id: 'admin-id', email: 'admin@example.com', role: [SystemRoles.ORGADMIN] },
        ],
        trainers: [
          { _id: 'trainer-id', email: 'trainer@example.com', role: [SystemRoles.TRAINER] },
        ],
      };
      getTrainingsByOrganizationMock.mockResolvedValue(trainings);
      deleteTrainingOrganizationMock.mockResolvedValue(deletedOrg);
      findTrainingOrganizationsByAdminMock.mockResolvedValue([]);
      findTrainingOrganizationsByTrainerMock.mockResolvedValue([]);
      updateUser.mockResolvedValue({});

      // Execute
      await deleteTrainingOrganization(req, res);

      // Assert
      expect(getTrainingsByOrganizationMock).toHaveBeenCalledWith('org-id');
      expect(deleteTrainingMock).not.toHaveBeenCalled(); // Should not be called since there are no trainings
      expect(deleteTrainingOrganizationMock).toHaveBeenCalledWith('org-id');
      expect(findTrainingOrganizationsByAdminMock).toHaveBeenCalledWith('admin-id');
      expect(findTrainingOrganizationsByTrainerMock).toHaveBeenCalledWith('trainer-id');
      expect(updateUser).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 400 if organization ID is missing', async () => {
      // Setup
      req.params.organizationId = '';

      // Execute
      await deleteTrainingOrganization(req, res);

      // Assert
      expect(deleteTrainingOrganizationMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing organization ID' });
    });

    it('should return 404 if organization is not found', async () => {
      // Setup
      req.params.organizationId = 'non-existent-id';
      deleteTrainingOrganizationMock.mockResolvedValue(null);

      // Execute
      await deleteTrainingOrganization(req, res);

      // Assert
      expect(deleteTrainingOrganizationMock).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Training organization not found' });
    });

    it('should handle errors', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      deleteTrainingOrganizationMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await deleteTrainingOrganization(req, res);

      // Assert
      expect(deleteTrainingOrganizationMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getTrainingOrganizationById', () => {
    it('should return a training organization by ID', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);

      // Execute
      await getTrainingOrganizationById(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(res.json).toHaveBeenCalledWith(organization);
    });

    it('should return 400 if organization ID is missing', async () => {
      // Setup
      req.params.organizationId = '';

      // Execute
      await getTrainingOrganizationById(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing organization ID' });
    });

    it('should return 404 if organization is not found', async () => {
      // Setup
      req.params.organizationId = 'non-existent-id';
      getTrainingOrganizationByIdMock.mockResolvedValue(null);

      // Execute
      await getTrainingOrganizationById(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Training organization not found' });
    });

    it('should handle errors', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      getTrainingOrganizationByIdMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await getTrainingOrganizationById(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('addAdministrator', () => {
    it('should add an administrator successfully', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'newadmin@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      const updatedOrg = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [{ _id: 'admin-id', email: 'newadmin@example.com' }],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValueOnce(organization);
      getTrainingOrganizationByIdMock.mockResolvedValueOnce(updatedOrg);
      findOrgAdminInvitationsByOrgId.mockResolvedValue([]);
      processAdministrators.mockResolvedValue();

      // Execute
      await addAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findOrgAdminInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(processAdministrators).toHaveBeenCalledWith(
        ['newadmin@example.com'],
        'org-id',
        'Test Organization',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedOrg);
    });

    it('should return 400 if organization ID is missing', async () => {
      // Setup
      req.params.organizationId = '';
      req.body.email = 'newadmin@example.com';

      // Execute
      await addAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing organization ID' });
    });

    it('should return 400 if email is invalid', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'invalid-email';

      // Execute
      await addAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email address' });
    });

    it('should return 404 if organization is not found', async () => {
      // Setup
      req.params.organizationId = 'non-existent-id';
      req.body.email = 'newadmin@example.com';
      getTrainingOrganizationByIdMock.mockResolvedValue(null);

      // Execute
      await addAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Training organization not found' });
    });

    it('should return 400 if administrator already exists in organization', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'existingadmin@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [{ _id: 'admin-id', email: 'existingadmin@example.com' }],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);

      // Execute
      await addAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Administrator already exists in this organization',
      });
    });

    it('should return 400 if administrator is already invited', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'invitedadmin@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      findOrgAdminInvitationsByOrgId.mockResolvedValue([
        { _id: 'invitation-id', email: 'invitedadmin@example.com' },
      ]);

      // Execute
      await addAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findOrgAdminInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Administrator already invited in this organization',
      });
    });

    it('should handle errors', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'newadmin@example.com';
      getTrainingOrganizationByIdMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await addAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('removeAdministrator', () => {
    it('should remove an administrator successfully', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'admin@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [
          { _id: 'admin-id', email: 'admin@example.com', role: [SystemRoles.ORGADMIN] },
        ],
        trainers: [],
      };
      const updatedOrg = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      removeAdminFromOrganizationMock.mockResolvedValue(updatedOrg);
      findTrainingOrganizationsByAdminMock.mockResolvedValue([]);
      updateUser.mockResolvedValue({});

      // Execute
      await removeAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(removeAdminFromOrganizationMock).toHaveBeenCalledWith('org-id', 'admin-id');
      expect(findTrainingOrganizationsByAdminMock).toHaveBeenCalledWith('admin-id');
      expect(updateUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedOrg);
    });

    it('should return 400 if organization ID is missing', async () => {
      // Setup
      req.params.organizationId = '';
      req.params.email = 'admin@example.com';

      // Execute
      await removeAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing organization ID' });
    });

    it('should return 400 if email is missing', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = '';

      // Execute
      await removeAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing administrator email' });
    });

    it('should return 404 if organization is not found', async () => {
      // Setup
      req.params.organizationId = 'non-existent-id';
      req.params.email = 'admin@example.com';
      getTrainingOrganizationByIdMock.mockResolvedValue(null);

      // Execute
      await removeAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Training organization not found' });
    });

    it('should remove admin role from invitation if user does not exist but has invitation', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'invited@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      findOrgAdminInvitationsByOrgId.mockResolvedValue([
        { _id: 'invitation-id', email: 'invited@example.com' },
      ]);
      removeOrgAdminRoleFromInvitation.mockResolvedValue({});

      // Execute
      await removeAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findOrgAdminInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(removeOrgAdminRoleFromInvitation).toHaveBeenCalledWith('invitation-id', 'org-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(organization);
    });

    it('should return 404 if user not found and no pending invitation exists', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'nonexistent@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      findOrgAdminInvitationsByOrgId.mockResolvedValue([]);

      // Execute
      await removeAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findOrgAdminInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found and no pending invitation exists',
      });
    });

    it('should handle errors', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'admin@example.com';
      getTrainingOrganizationByIdMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await removeAdministrator(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('addTrainer', () => {
    it('should add a trainer successfully', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'newtrainer@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      const updatedOrg = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [{ _id: 'trainer-id', email: 'newtrainer@example.com' }],
      };
      getTrainingOrganizationByIdMock.mockResolvedValueOnce(organization);
      getTrainingOrganizationByIdMock.mockResolvedValueOnce(updatedOrg);
      findTrainerInvitationsByOrgId.mockResolvedValue([]);
      processTrainers.mockResolvedValue();

      // Execute
      await addTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findTrainerInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(processTrainers).toHaveBeenCalledWith(
        ['newtrainer@example.com'],
        'org-id',
        'Test Organization',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedOrg);
    });

    it('should return 400 if organization ID is missing', async () => {
      // Setup
      req.params.organizationId = '';
      req.body.email = 'newtrainer@example.com';

      // Execute
      await addTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing organization ID' });
    });

    it('should return 400 if email is invalid', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'invalid-email';

      // Execute
      await addTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email address' });
    });

    it('should return 404 if organization is not found', async () => {
      // Setup
      req.params.organizationId = 'non-existent-id';
      req.body.email = 'newtrainer@example.com';
      getTrainingOrganizationByIdMock.mockResolvedValue(null);

      // Execute
      await addTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Training organization not found' });
    });

    it('should return 400 if trainer already exists in organization', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'existingtrainer@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [{ _id: 'trainer-id', email: 'existingtrainer@example.com' }],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);

      // Execute
      await addTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Trainer already exists in this organization',
      });
    });

    it('should return 400 if trainer is already invited', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'invitedtrainer@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      findTrainerInvitationsByOrgId.mockResolvedValue([
        { _id: 'invitation-id', email: 'invitedtrainer@example.com' },
      ]);

      // Execute
      await addTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findTrainerInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Trainer already invited in this organization',
      });
    });

    it('should handle errors', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.body.email = 'newtrainer@example.com';
      getTrainingOrganizationByIdMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await addTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('removeTrainer', () => {
    it('should remove a trainer successfully', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'trainer@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [
          { _id: 'trainer-id', email: 'trainer@example.com', role: [SystemRoles.TRAINER] },
        ],
      };
      const updatedOrg = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      removeTrainerFromOrganizationMock.mockResolvedValue(updatedOrg);
      findTrainingOrganizationsByTrainerMock.mockResolvedValue([]);
      updateUser.mockResolvedValue({});

      // Execute
      await removeTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(removeTrainerFromOrganizationMock).toHaveBeenCalledWith('org-id', 'trainer-id');
      expect(findTrainingOrganizationsByTrainerMock).toHaveBeenCalledWith('trainer-id');
      expect(updateUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedOrg);
    });

    it('should return 400 if organization ID is missing', async () => {
      // Setup
      req.params.organizationId = '';
      req.params.email = 'trainer@example.com';

      // Execute
      await removeTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing organization ID' });
    });

    it('should return 400 if email is missing', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = '';

      // Execute
      await removeTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing trainer email' });
    });

    it('should return 404 if organization is not found', async () => {
      // Setup
      req.params.organizationId = 'non-existent-id';
      req.params.email = 'trainer@example.com';
      getTrainingOrganizationByIdMock.mockResolvedValue(null);

      // Execute
      await removeTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Training organization not found' });
    });

    it('should remove trainer role from invitation if user does not exist but has invitation', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'invited@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      findTrainerInvitationsByOrgId.mockResolvedValue([
        { _id: 'invitation-id', email: 'invited@example.com' },
      ]);
      removeTrainerRoleFromInvitation.mockResolvedValue({});

      // Execute
      await removeTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findTrainerInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(removeTrainerRoleFromInvitation).toHaveBeenCalledWith('invitation-id', 'org-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(organization);
    });

    it('should return 404 if user not found and no pending invitation exists', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'nonexistent@example.com';
      const organization = {
        _id: 'org-id',
        name: 'Test Organization',
        administrators: [],
        trainers: [],
      };
      getTrainingOrganizationByIdMock.mockResolvedValue(organization);
      findTrainerInvitationsByOrgId.mockResolvedValue([]);

      // Execute
      await removeTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalledWith('org-id');
      expect(findTrainerInvitationsByOrgId).toHaveBeenCalledWith('org-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Trainer not found and no pending invitation exists',
      });
    });

    it('should handle errors', async () => {
      // Setup
      req.params.organizationId = 'org-id';
      req.params.email = 'trainer@example.com';
      getTrainingOrganizationByIdMock.mockRejectedValue(new Error('Database error'));

      // Execute
      await removeTrainer(req, res);

      // Assert
      expect(getTrainingOrganizationByIdMock).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
});
