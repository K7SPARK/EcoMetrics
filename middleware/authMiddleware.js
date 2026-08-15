module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  },
  forwardAuthenticated: (req, res, next) => {
    if (req.session && req.session.user) {
      return res.redirect('/screener');
    }
    next();
  }
};