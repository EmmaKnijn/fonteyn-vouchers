const express = require('express');
const passport = require('passport');

const router = express.Router();

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ user: { id: user.id, email: user.email, role: user.role } });
    });
  })(req, res, next);
});

// Entra ID login route
router.get('/entra', passport.authenticate('openidconnect'));

// Entra ID callback route
router.post('/entra/callback',
  passport.authenticate('openidconnect', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role } });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = router;
