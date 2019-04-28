import 'babel-polyfill';
import request from 'supertest';
import server from '../../index';
import User from '../../models/user';
import Role from '../../models/role';
import Document from '../../models/document';

let doc1;
let user1;

describe('documents/put', () => {
  beforeEach(async () => {
    server; //start server
    const regular = await Role.create({ title: 'regular' });

    user1 = await User.create({
      name: { first: 'nnamdi', last: 'lawal' },
      email: '66nnamdi@mail.com',
      userName: '66nnamdi',
      password: 'sweetlove',
      role: regular._id
    });

    doc1 = await Document.create({
      access: 'role',
      ownerId: '5cc33f7e04fc5f18a52d8354',
      title: 'Document1',
      content: 'Document',
      role: regular._id
    });

    //old document that is created  by user1 to already in db before test
  });

  afterEach(async () => {
    await server.close(); //close server
    await User.deleteMany({});
    await Role.deleteMany({});
    await Document.deleteMany({});
  });

  test('that a user not logged in cannot modify a document', async () => {
    const res = await request(server)
      .put(`/api/documents/${doc1._id}`)
      .send({ title: 'Document1' });
    expect(res.status).toBe(401);
  });
  //test that only user that created the document can modify it
  test('that only user that created the document can modify it', async () => {
    const token = new User().generateToken();
    const cc = await Document.find();
    const res = await request(server)
      .put(`/api/documents/${doc1._id}`)
      .set('x-auth-token', token)
      .send({ title: 'Document1' });
    expect(res.status).toBe(403);
  });
}); //end of describe

//test that only logged in user can update document
//test that invalid id returns a status of 404
//test that it is updated in the database
//test that if title is updated it, the new title is updated
