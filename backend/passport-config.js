const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-openidconnect').Strategy;
const bcrypt = require('bcrypt');
const { User } = require('./db');

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return done(null, false, { message: 'Incorrect email.' });
      if (!user.password_hash) return done(null, false, { message: 'Use Entra ID for this account.' });
      
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return done(null, false, { message: 'Incorrect password.' });
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Placeholder OIDC Strategy for Entra ID
// Will only work if credentials are provided in .env
if (process.env.ENTRA_CLIENT_ID && process.env.ENTRA_CLIENT_ID !== 'your_client_id') {
  passport.use(new OIDCStrategy({
      issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      authorizationURL: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/oauth2/v2.0/token`,
      userInfoURL: `https://graph.microsoft.com/oidc/userinfo`,
      clientID: process.env.ENTRA_CLIENT_ID,
      clientSecret: process.env.ENTRA_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/entra/callback',
      scope: ['profile', 'email', 'openid']
    },
    async (issuer, profile, done) => {
      try {
        let user = await User.findOne({ where: { email: profile.emails[0].value } });
        if (!user) {
          user = await User.create({
            email: profile.emails[0].value,
            role: 'viewer' // Default role
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
