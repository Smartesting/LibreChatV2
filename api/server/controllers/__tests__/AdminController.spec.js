const { getAdminUsersController } = require('../AdminController');
const { findUsers } = require('~/models');
const { SystemRoles } = require('librechat-data-provider');

jest.mock('~/models', () => ({
  findUsers: jest.fn(),
  findUser: jest.fn(),
  updateUser: jest.fn(),
  findAdminInvitationByEmail: jest.fn(),
  removeAdminRoleFromInvitation: jest.fn(),
}));

jest.mock('~/config', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AdminController', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getAdminUsersController', () => {
    it('should return all admin users', async () => {
      const mockAdminUsers = [
        { _id: '1', email: 'admin1@example.com', role: [SystemRoles.ADMIN] },
        { _id: '2', email: 'admin2@example.com', role: [SystemRoles.ADMIN] },
      ];
      findUsers.mockResolvedValue(mockAdminUsers);

      await getAdminUsersController(req, res);

      expect(findUsers).toHaveBeenCalledWith(
        { role: SystemRoles.ADMIN },
        { password: false, totpSecret: false },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAdminUsers);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      findUsers.mockRejectedValue(error);

      await getAdminUsersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching admin users' });
    });
  });
});
