//Library imports
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

//Local imports
const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

let app = express(); //Creates a server
const port = process.env.PORT || 3000; //If on heroku, use the environment port, else use port 3000

app.use(bodyParser.json()); //Middleware, handles the req and res requests

//Creates an express route to /todos
app.post('/todos', (req, res) => {
    let todo = new Todo({
        text: req.body.text //Todo's text data
    });

    todo.save().then((doc) => {
        res.send(doc); //Sends data to database and submits it
    }, (e) => {
        res.status(400).send(e); //If invalid, results in 404
    });
});

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({todos}); //Returns Todos database
    }, (e) => {
        res.status(404).send(e); //Results in 404 if an error occurs
    });
});

app.get('/todos/:id', (req, res) => {
    let id = req.params.id; //Gets id parameter from url

    //If parameter isn't a valid mongo _id, results in a 404
    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findById(id).then((todo) => {
        //If id cannot be found, results in a 404
        if (!todo) {
            return res.status(404).send();
        }

        res.status(200).send({todo}); //Display the result
    }).catch((e) => res.status(400).send(e)); //If error, throw 400
});

app.delete('/todos/:id', (req, res) => {
    let id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findByIdAndRemove(id).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }

    res.status(200).send({todo});
    }).catch((e) => res.status(400).send(e));
});

app.patch('/todos/:id', (req, res) => {
    let id = req.params.id;
    let body = _.pick(req.body, ['text', 'completed']);

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, {$set:body}, {new: true}).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }

        res.send({todo});
    }).catch((e) => res.status(400).send())
});

//Listens on specific port which is determined at the beginning of the script
app.listen(port, () => {
    console.log(`Started on port ${port}`);
});

module.exports = {app}; //exports the app for testing



