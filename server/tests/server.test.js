//Library imports
const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

//Local imports
const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [{
    _id: new ObjectID(),
    text: 'First test'
}, {
    _id: new ObjectID(),
    text: 'Second test',
    completed: true,
    complatedAt: 333
}];

beforeEach((done) => {
    Todo.deleteMany({}).then(() => {
        Todo.insertMany(todos);
    }).then(() => done());
});

describe('POST /todos', () => {
    it('Should create a new todo', (done) => {
        let text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('Should not create todo with invalid body data', (done) => {
        request(app)
            .post('/todos')
            .send()
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((e) => done(e));
            });
    });
});

describe('GET /todos', () => {
    it('Should get all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('Should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    it('Should return 404 if todo not found', (done) => {
        let randomId = new ObjectID().toHexString();
        
        request(app)
            .get(`/todos/${randomId}`)
            .expect(404)
            .end(done)
    });

    it('Should return 400 for non-object ids', (done) => {
        let invalidId = 123;

        request(app)
            .get(`/todos/${invalidId}`)
            .expect(400)
            .end(done)
    });
});

describe('DELETE /todos/:id', () => {
    it('Should remove a todo', (done) => {
        let hexId = todos[1]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(hexId);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(hexId).then((todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch((e) => done(e));
            });

    });

    it('Should return a 404 if todo not found', (done) => {
        let randomId = new ObjectID().toHexString();
        
        request(app)
            .delete(`/todos/${randomId}`)
            .expect(404)
            .end(done)
    });

    it('Should return 400 if object id is invalid', (done) => {
        let invalidId = 123;

        request(app)
            .delete(`/todos/${invalidId}`)
            .expect(400)
            .end(done)
    });
}); 

describe('PATCH /todos/:id', () => {
    it('Should update the todo', (done) => {
        let hexId = todos[0]._id.toHexString();
        let updateBody = {
            text: 'This is an updated body',
            completed: true
        }
        request(app)
            .patch(`/todos/${hexId}`)
            .send(updateBody)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(updateBody.text);
                expect(res.body.todo.completed).toBe(true);
                expect(typeof res.body.todo.completedAt).toBe('number');
            })
            .end(done)
    });

    it('Should clear completedAt when todo is not completed', (done) => {
        let hexId = todos[1]._id.toHexString();
            let updateBody = {
                text: 'This is an updated body',
                completed: false
            }
            request(app)
                .patch(`/todos/${hexId}`)
                .send(updateBody)
                .expect(200)
                .expect((res) => {
                    expect(res.body.todo.text).toBe(updateBody.text);
                    expect(res.body.todo.completed).toBe(false);
                    expect(res.body.todo.completedAt).toBeFalsy();
                })
                .end(done)
        
        //grab id of second item
        //update text, set completed false
        //200
        //text is changed, completed is false, completedAt is falsey
    });
});

