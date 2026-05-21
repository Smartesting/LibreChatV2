// Set environment variables for testing
process.env.DOMAIN_CLIENT = 'http://localhost:3080';
process.env.APP_TITLE = 'LibreChat';

// Mock server/utils before requiring any modules that use it
jest.mock('../utils', () => ({
  sendEmail: jest.fn(),
  checkEmailConfig: jest.fn(),
  isUserProvided: jest.fn().mockReturnValue(true),
  generateConfig: jest.fn().mockImplementation((key) => ({ apiKey: key })),
}));

// Mock Config/EndpointService before requiring any modules that use it
jest.mock('./Config/EndpointService', () => ({
  config: {
    openAIApiKey: 'mock-key',
    azureOpenAIApiKey: 'mock-key',
    useAzurePlugins: false,
    userProvidedOpenAI: true,
  },
}));

// Mock Config/index.js
jest.mock('./Config', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  getBalanceConfig: jest.fn().mockReturnValue({ enabled: false }),
}));

// Mock Balance model
jest.mock('../../models', () => ({
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

// Now require the modules that depend on the mocked modules
const { processGrantAdminAccess } = require('./AdminService');
const {
  findUser,
  updateUser,
  findAdminInvitationByEmail,
  createAdminInvitation,
} = require('../../models');
const { sendEmail } = require('../utils');
const { checkEmailConfig } = require('@librechat/api');
const { logger } = require('../../config');
const { SystemRoles } = require('librechat-data-provider');

// Mock other dependencies
jest.mock('../../models', () => ({
  updateUser: jest.fn(),
}));
jest.mock('librechat-data-provider', () => ({
  SystemRoles: {
    ADMIN: 'ADMIN',
  },
  EModelEndpoint: {
    anthropic: 'anthropic',
    chatGPTBrowser: 'chatGPTBrowser',
    openAI: 'openAI',
    azureOpenAI: 'azureOpenAI',
    assistants: 'assistants',
    azureAssistants: 'azureAssistants',
    bedrock: 'bedrock',
    agents: 'agents',
  },
}));

describe('AdminService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('processGrantAdminAccess', () => {
    it('should return error for invalid email', async () => {
      const result = await processGrantAdminAccess('invalid-email');

      expect(result).toEqual({
        success: false,
        status: 400,
        message: 'Invalid email address',
      });
      expect(findUser).not.toHaveBeenCalled();
    });

    it('should return error if user already has admin role', async () => {
      findUser.mockResolvedValue({
        _id: 'user-id',
        email: 'admin@example.com',
        role: [SystemRoles.ADMIN],
      });

      const result = await processGrantAdminAccess('admin@example.com');

      expect(result).toEqual({
        success: false,
        status: 400,
        message: 'User already has admin role',
      });
      expect(findUser).toHaveBeenCalledWith({ email: 'admin@example.com' }, 'email _id role');
      expect(updateUser).not.toHaveBeenCalled();
    });

    it('should return error if user has trainee role', async () => {
      findUser.mockResolvedValue({
        _id: 'user-id',
        email: 'trainee@example.com',
        role: [SystemRoles.TRAINEE],
      });

      const result = await processGrantAdminAccess('trainee@example.com');

      expect(result).toEqual({
        success: false,
        status: 400,
        message: 'Trainee user cannot have admin role',
      });
      expect(findUser).toHaveBeenCalledWith({ email: 'trainee@example.com' }, 'email _id role');
      expect(updateUser).not.toHaveBeenCalled();
    });

    it('should update user role if user exists without admin role', async () => {
      findUser.mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER'],
      });

      updateUser.mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER', SystemRoles.ADMIN],
      });

      checkEmailConfig.mockReturnValue(true);
      sendEmail.mockResolvedValue();

      const result = await processGrantAdminAccess('user@example.com');

      expect(result).toEqual({
        success: true,
        status: 200,
        message: 'Admin role granted successfully',
        user: {
          _id: 'user-id',
          email: 'user@example.com',
          role: ['USER', SystemRoles.ADMIN],
        },
      });
      expect(findUser).toHaveBeenCalledWith({ email: 'user@example.com' }, 'email _id role');
      expect(updateUser).toHaveBeenCalledWith('user-id', {
        role: ['USER', SystemRoles.ADMIN],
      });
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should return error if updating user role fails', async () => {
      findUser.mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER'],
      });

      updateUser.mockResolvedValue(null);

      const result = await processGrantAdminAccess('user@example.com');

      expect(result).toEqual({
        success: false,
        status: 500,
        message: 'Failed to update user role',
      });
      expect(findUser).toHaveBeenCalledWith({ email: 'user@example.com' }, 'email _id role');
      expect(updateUser).toHaveBeenCalledWith('user-id', {
        role: ['USER', SystemRoles.ADMIN],
      });
    });

    it('should return error if invitation already exists', async () => {
      findUser.mockResolvedValue(null);
      findAdminInvitationByEmail.mockResolvedValue({
        _id: 'invitation-id',
        email: 'new@example.com',
      });

      const result = await processGrantAdminAccess('new@example.com');

      expect(result).toEqual({
        success: false,
        status: 400,
        message: 'An invitation has already been sent to this email',
      });
      expect(findUser).toHaveBeenCalledWith({ email: 'new@example.com' }, 'email _id role');
      expect(findAdminInvitationByEmail).toHaveBeenCalledWith('new@example.com');
      expect(createAdminInvitation).not.toHaveBeenCalled();
    });

    it('should create invitation if user does not exist', async () => {
      findUser.mockResolvedValue(null);
      findAdminInvitationByEmail.mockResolvedValue(null);
      createAdminInvitation.mockResolvedValue({
        invitation: { _id: 'invitation-id', email: 'new@example.com' },
        token: 'invitation-token',
      });
      checkEmailConfig.mockReturnValue(true);
      sendEmail.mockResolvedValue();

      const result = await processGrantAdminAccess('new@example.com');

      expect(result).toEqual({
        success: true,
        status: 201,
        message: 'Invitation sent successfully',
        invitation: { _id: 'invitation-id', email: 'new@example.com' },
      });
      expect(findUser).toHaveBeenCalledWith({ email: 'new@example.com' }, 'email _id role');
      expect(findAdminInvitationByEmail).toHaveBeenCalledWith('new@example.com');
      expect(createAdminInvitation).toHaveBeenCalledWith('new@example.com');
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      findUser.mockRejectedValue(new Error('Database error'));

      const result = await processGrantAdminAccess('user@example.com');

      expect(result).toEqual({
        success: false,
        status: 500,
        message: 'Error processing invitation',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('sendAdminInvitationEmail', () => {
    // This function is private, but we can test it indirectly through processGrantAdminAccess
    it('should not send email if email configuration is not available', async () => {
      findUser.mockResolvedValue(null);
      findAdminInvitationByEmail.mockResolvedValue(null);
      createAdminInvitation.mockResolvedValue({
        invitation: { _id: 'invitation-id', email: 'new@example.com' },
        token: 'invitation-token',
      });
      checkEmailConfig.mockReturnValue(false);

      await processGrantAdminAccess('new@example.com');

      expect(sendEmail).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      findUser.mockResolvedValue(null);
      findAdminInvitationByEmail.mockResolvedValue(null);
      createAdminInvitation.mockResolvedValue({
        invitation: { _id: 'invitation-id', email: 'new@example.com' },
        token: 'invitation-token',
      });
      checkEmailConfig.mockReturnValue(true);
      sendEmail.mockRejectedValue(new Error('Email sending error'));

      const result = await processGrantAdminAccess('new@example.com');

      // The function should still return success even if email sending fails
      expect(result).toEqual({
        success: true,
        status: 201,
        message: 'Invitation sent successfully',
        invitation: { _id: 'invitation-id', email: 'new@example.com' },
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('sendNotificationEmail', () => {
    // This function is private, but we can test it indirectly through processGrantAdminAccess
    it('should not send notification if email configuration is not available', async () => {
      findUser.mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER'],
      });

      updateUser.mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER', SystemRoles.ADMIN],
      });

      checkEmailConfig.mockReturnValue(false);

      await processGrantAdminAccess('user@example.com');

      expect(sendEmail).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle notification email sending errors gracefully', async () => {
      findUser.mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER'],
      });

      updateUser.mockResolvedValue({
        _id: 'user-id',
        email: 'user@example.com',
        role: ['USER', SystemRoles.ADMIN],
      });

      checkEmailConfig.mockReturnValue(true);
      sendEmail.mockRejectedValue(new Error('Email sending error'));

      const result = await processGrantAdminAccess('user@example.com');

      // The function should still return success even if email sending fails
      expect(result).toEqual({
        success: true,
        status: 200,
        message: 'Admin role granted successfully',
        user: {
          _id: 'user-id',
          email: 'user@example.com',
          role: ['USER', SystemRoles.ADMIN],
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
