const User = require('../models/User');

exports.getLogin = (req, res) => res.render('auth/login', { error: null });
exports.getSignup = (req, res) => res.render('auth/signup', { error: null });

exports.postSignup = async (req, res) => {
  // Frontend se 'name' ya 'fullName' dono ko safely accept kar rahe hain
  const name = req.body.name || req.body.fullName;
  const { email, password, confirmPassword } = req.body;

  // Basic Validations
  if (!name || !email || !password) {
    return res.render('auth/signup', { error: 'Please fill in all required fields.' });
  }

  if (password !== confirmPassword) {
    return res.render('auth/signup', { error: 'Passwords do not match.' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.render('auth/signup', { error: 'Email is already registered.' });
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    // Save session & redirect
    req.session.user = { id: user._id, name: user.name, email: user.email };
    
    req.session.save((err) => {
      if (err) {
        console.error('Session Save Error:', err);
      }
      res.redirect('/screener');
    });

  } catch (error) {
    // Server terminal me exact error print hoga taaki debugging aasaan ho
    console.error('CRITICAL SIGNUP ERROR:', error);
    res.render('auth/signup', { error: 'Server error during signup: ' + (error.message || 'Unknown error') });
  }
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/login', { error: 'Please provide both email and password.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await user.matchPassword(password))) {
      return res.render('auth/login', { error: 'Invalid email or password.' });
    }

    req.session.user = { id: user._id, name: user.name, email: user.email };
    
    const redirectTo = req.session.returnTo || '/screener';
    delete req.session.returnTo;

    req.session.save((err) => {
      if (err) {
        console.error('Session Save Error:', err);
      }
      res.redirect(redirectTo);
    });

  } catch (error) {
    console.error('CRITICAL LOGIN ERROR:', error);
    res.render('auth/login', { error: 'Server error during login.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout Error:', err);
    }
    res.redirect('/login');
  });
};