const { User } = require('./../models/user');

const authenticate = (req, res, next) => {
  const token = req.header('x-auth'); // Gets x-auth header which should contain a token

  //  Finds user by token in database
  User.findByToken(token)
    .then(user => {
      if (!user) {
        return Promise.reject();
      }

      req.user = user;
      req.token = token;
      next();
    })
    .catch(e => {
      res.status(401).send();
    });
};

module.exports = { authenticate };
