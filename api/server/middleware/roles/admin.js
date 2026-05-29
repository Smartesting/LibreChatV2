const { SystemRoles } = require('librechat-data-provider');

function checkAdmin(req, res, next) {
  try {
    const role = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    if (!role.includes(SystemRoles.ADMIN)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = checkAdmin;
