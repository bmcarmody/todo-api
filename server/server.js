require('./config/config');

//Library imports
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

//Local imports
const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');


let app = express(); //Creates a server

app.use(bodyParser.json()); //Middleware

/**
 * Creates a POST /todos route
 * Ensures that user is authenicated before posting
 */
app.post('/todos', authenticate, (req, res) => {
    let todo = new Todo({
        text: req.body.text, //Todo's text data
        _creator: req.user._id
    });

    todo.save().then((doc) => {
        res.send(doc); //Sends data to database and submits it
    }, (e) => {
        res.status(400).send(e); //If invalid, results in 400
    });
});

/**
 * Creates a GET /todos route
 * Ensures that user is authenicated before getting
 * all todos for specifc user
 */
app.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user._id //Find all posts with requested id from user
    }).then((todos) => {
        res.send({todos}); //Returns Todos database
    }, (e) => {
        res.status(404).send(e); //Results in 404 if an error occurs
    });
});

/**
 * Creates a GET /todos/:id route
 * Ensures that user is authenticated before getting
 * post with the post id and also ensure that post
 * was created by the user who is requesting it
 */
app.get('/todos/:id',authenticate, (req, res) => {
    let id = req.params.id; //Gets id parameter from url

    //If parameter isn't a valid mongo _id, results in a 400
    if(!ObjectID.isValid(id)) {
        return res.status(400).send();
    }

    //Searches the database for the post id and user id
    Todo.findOne({
        _id: id,
        _creator: req.user._id //Gets the user id from the authenticate middleware
    }).then((todo) => {
        //If id cannot be found, results in a 404
        if (!todo) {
            return res.status(404).send();
        }

        res.status(200).send({todo}); //Display the todo found by id
    }).catch((e) => res.status(400).send(e)); //If error, throw 400
});

/**
 * Creates a DELETE /todos/:id route
 * Ensures that user is authenticated and created
 * the post before deleting
 */
app.delete('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id; //Gets post id

    //If id isn't valid, throw 400
    if(!ObjectID.isValid(id)) {
        return res.status(400).send();
    }

    //Searches the data for post and removes it if found
    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id //Gets the user id from the authenticate middleware
    }).then((todo) => { 
        //If no post if found with the following credentials, throws a 404
        if (!todo) {
            return res.status(404).send();
        }
        res.status(200).send({todo}); //Sends a 200 when todo post is found and sends the post that was deleted
    }).catch((e) => res.status(400).send(e)); 
});

/**
 * Creates PATCH /todos/:id route
 * Ensures that user is authenticated and that the post
 * that is trying to be modified was created by that user
 * before modifiying in the database
 */
app.patch('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id;
    let body = _.pick(req.body, ['text', 'completed']); //Only retreving the body elements that the user can modify

    //If id isn't valid, throws a 404
    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    //If completed = true, sets the complatedAt value to current time
    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    //Searches database with user credentials and updates post if found
    Todo.findOneAndUpdate({
        "_id": id,
        "_creator": req.user._id}, //Gets the user id from the authenticate middleware
        { $set: body}, //Sets the value data in the database
        {new: true}
    ).then((todo) => {
        //Returns a 404 if no todo was found in database
        if (!todo) {
            return res.status(404).send();
        }
        res.send({todo}); //Sends back modified todo
    }).catch((e) => res.status(400).send())
});

/**
 * Creates POST /users route
 * Creates a user with the email and password fields
 * then generates an auth token
 */
app.post('/users', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']); //Gets email and password from request body
    let user = new User(body);

    //Saves the user in the database, creating an auth token which is sends back
    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user); //Sends back auth token and created user
    }).catch((e) => res.status(400).send(e)); //If email or password fail validation, a 400 will be sent back
});

/**
 * Creates GET /users/me route
 * Authenitcates user that is requesting
 * and sends back user information such as id and email
 */
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user); //Uses authenticate middleware
});

/**
 * Creates POST /users/login route
 * Authenticates user by email and password then
 * generates an auth token
 */
app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);
    
    //Searches for user in the database with email and password
    //Users.findByCredentials method is located in /models/user
    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user); //Sends back user with x-auth token in header
        });
    }).catch((e) => {
        res.status(400).send();
    });
});

/**
 * Creates DELETE /users/me/token route
 * Authenticates user and then removes token
 * req.user.removeToken method is located in /models/user
 */
app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    })
});

//Listens on specific port which is determined at the beginning of the script
app.listen(process.env.PORT, () => {
    console.log(`Started on port ${process.env.PORT}`);
});

module.exports = {app}; //exports the app for testing



