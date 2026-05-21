const express = require('express');
const router = express.Router();
const { requireJwtAuth, checkTrainingAccess } = require('~/server/middleware');
const { findSession } = require('~/models');
const cookies = require('cookie');
const jwt = require('jsonwebtoken');

router.get('/', requireJwtAuth, checkTrainingAccess, async (req, res) => {
  try {
    const refreshToken = req.headers.cookie ? cookies.parse(req.headers.cookie).refreshToken : null;
    if (!refreshToken) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(403).send({ message: 'Access Denied' });
    }

    const session = await findSession({ sessionId: payload.sessionId, userId: req.user.id });
    res.status(200).send(session);
  } catch (error) {
    res.status(500).send({ message: 'Failed to find session', error: error.message });
  }
});

module.exports = router;
