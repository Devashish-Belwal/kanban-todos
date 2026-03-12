import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Step 1: redirect user to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Step 2: Google redirects back here with an auth code
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}?error=auth_failed`,
  }),
  (_req, res) => {
    // Success — redirect to the boards page
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173/boards');
  }
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});

export default router;