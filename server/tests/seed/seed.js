const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
    _id: userOneId,
    email: 'example@gmail.com',
    password: 'anotherpass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, 'secretvalue').toString()
    }]
}, {
    _id: userTwoId,
    email: 'jo@yahoo.com',
    password: 'password'
}];

const todos = [{
    _id: new ObjectID(),
    text: 'First test'
}, {
    _id: new ObjectID(),
    text: 'Second test',
    completed: true,
    complatedAt: 333
}];

const populateTodos = (done) => {
    Todo.deleteMany({}).then(() => {
        Todo.insertMany(todos);
    }).then(() => done());
};

const populateUsers = (done) => {
    User.remove({}).then(() => {
        let userOne = new User(users[0]).save();
        let userTwo = new User(users[1]).save();

        return Promise.all([userOne, userTwo])
    }).then(() => done());
};

module.exports = {todos, populateTodos, users, populateUsers};