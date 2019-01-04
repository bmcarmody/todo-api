// Library imports
const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

// Local imports
const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('Should create a new todo', done => {
    const text = 'Test todo text';

    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({ text })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then(todoResult => {
            expect(todoResult.length).toBe(1);
            expect(todoResult[0].text).toBe(text);
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it('Should not create todo with invalid body data', done => {
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send()
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todoResult => {
            expect(todoResult.length).toBe(2);
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });
});

describe('GET /todos', () => {
  it('Should get all todos', done => {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('Should return todo doc', done => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('Should not return todo doc created by other user', done => {
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('Should return 404 if todo not found', done => {
    const randomId = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${randomId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('Should return 400 for non-object ids', done => {
    const invalidId = 123;

    request(app)
      .get(`/todos/${invalidId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('Should remove a todo', done => {
    const hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toBeFalsy();
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it('Should not remove a todo if not authenticated', done => {
    const hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toBeTruthy();
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it('Should return a 404 if todo not found', done => {
    const randomId = new ObjectID().toHexString();

    request(app)
      .delete(`/todos/${randomId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('Should return 400 if object id is invalid', done => {
    const invalidId = 123;

    request(app)
      .delete(`/todos/${invalidId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('Should update the todo', done => {
    const hexId = todos[0]._id.toHexString();
    const updateBody = {
      text: 'This is an updated body',
      completed: true
    };
    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .send(updateBody)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(updateBody.text);
        expect(res.body.todo.completed).toBe(true);
        expect(typeof res.body.todo.completedAt).toBe('number');
      })
      .end(done);
  });

  it('Should not update the todo when user is not authenticated', done => {
    const hexId = todos[0]._id.toHexString();
    const updateBody = {
      text: 'This is an updated body',
      completed: true
    };
    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send(updateBody)
      .expect(404)
      .end(done);
  });

  it('Should clear completedAt when todo is not completed', done => {
    const hexId = todos[1]._id.toHexString();
    const updateBody = {
      text: 'This is an updated body',
      completed: false
    };
    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send(updateBody)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(updateBody.text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('Should return user if authenticated', done => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('Should return a 401 if not authenticated', done => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('Should create a user', done => {
    const email = 'example@example.com';
    const password = 'abc12345';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toBeDefined();
        expect(res.body._id).toBeDefined();
        expect(res.body.email).toBe(email);
      })
      .end(err => {
        if (err) {
          return done(err);
        }

        User.findOne({ email })
          .then(user => {
            expect(user).toBeDefined();
            expect(user.password).not.toBe(password);
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it('Should return validation errors if request is invalid', done => {
    const email = 'example';
    const password = 'abc12';

    request(app)
      .post('/users')
      .send({
        email,
        password
      })
      .expect(400)
      .end(done);
  });

  it('Should not create user if the email is in use', done => {
    const password = 'abc12345';

    request(app)
      .post('/users')
      .send({
        email: users[0].email,
        password
      })
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('Should login user and return auth token', done => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toBeDefined();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id)
          .then(user => {
            expect(user.tokens[1]).toMatchObject({
              access: 'auth',
              token: res.headers['x-auth']
            });
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it('Should reject invalid login', done => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: 'cat'
      })
      .expect(400)
      .expect(res => {
        expect(res.headers['x-auth']).not.toBeDefined();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id)
          .then(user => {
            expect(user.tokens.length).toBe(1);
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('Should remove auth token on logout', done => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id)
          .then(user => {
            expect(user.tokens[0]).toEqual();
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });
});
