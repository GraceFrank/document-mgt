const validate = require('../api-validations/document');
const { Document, User, Role } = require('../models');
const response = require('../helpers/responses');

class Documents {
  /**
   * Method to create a document
   * @param {object} req
   * @param {object} res
   * @return {object} JSON response
   */
  async post(req, res) {
    try {
      //validate the request body params
      const { error } = validate(req.body);
      if (error)
        return response.badRequest(res, { message: error.details[0].message });

      //search if role already exists
      const existingDoc = await Document.findOne({
        title: req.body.title,
        ownerId: req.user.userId
      });
      if (existingDoc)
        return response.alreadyExists(res, {
          message: 'document with title already exist'
        });

      //creating the new document
      const doc = await Document.create({
        ownerId: req.user.userId,
        title: req.body.title,
        content: req.body.content,
        access: req.body.access || 'public',
        role: req.user.roleId
      });

      return response.created(res, doc);
    } catch (error) {
      return response.internalError(res, { error });
    }
  }

  /**
   * Method to fetch all documents a user has access to
   * @param {object} req
   * @param {object} res
   * @return {object} JSON response
   */
  async get(req, res, next) {
    try {
      // convert query to number
      let page = Number(req.query.page);
      let limit = Number(req.query.limit);

      //assign default values if query params are invalid
      page = page ? page : 1;
      limit = limit ? limit : 20;

      //Queries to run based on the role of the user
      const roleQuery = {
        admin: {
          $or: [
            { access: 'private', ownerId: req.user.userId },
            { access: { $ne: 'private' } }
          ]
        }, //this query will be run if user is an admin
        otherRoles: {
          $or: [
            { access: 'private', ownerId: req.user._id },
            { access: 'public' },
            { role: req.user.role, access: 'role' }
          ]
        }, //this query will be run for the other roles
        public: { access: 'public' } //this query will run if user is not logged in
      };

      //get the role of the user
      let userRole = await Role.findById(req.user.roleId);
      userRole = userRole.title;

      //determining which query should run from the users role
      let query;
      if (req.user) query = roleQuery.public;
      query = userRole === 'admin' ? roleQuery.admin : roleQuery.otherRoles;

      const queryOptions = {
        skip: (page - 1) * limit,
        limit: limit,
        sort: { date: -1 }
      };
      const documents = await Document.find(query, queryOptions);

      const message =
        'Array of 0 or more documents has been fetched successfully';
      return response.success(res, { message, documents });
    } catch (error) {
      return response.internalError(res, { error });
    }
  }

  /**
   * Method to update a users document
   * @param {object} req
   * @param {object} res
   * @return {object} JSON response
   */
  async put(req, res) {
    try {
      //validate the request body params
      const { error } = validate(req.body);
      if (error)
        return response.badRequest(res, { message: error.details[0].message });

      //fetch the required
      const doc = await Document.findOne({
        _id: req.params.id,
        ownerId: req.user.userId
      });
      if (!doc)
        return response.notFound(res, { message: 'Document not found' });

      //check that new doc title is unique to the user
      const existingDoc = await Document.findOne({
        title: req.body.title,
        _id: { $ne: req.params.id },
        ownerId: req.userId
      });
      if (existingDoc)
        return response.badRequest(res, { message: 'document already exists' });

      //update the document in the db
      const update = await Document.findByIdAndUpdate(req.params.id, req.body);
      return response.success(res, update);
    } catch (error) {
      return response.internalError(res, { error });
    }
  }

  /**
   * Method to delete a users document
   * @param {object} req
   * @param {object} res
   * @return {object} JSON response
   */
  async delete(req, res) {
    try {
      //checking if document exist on db
      const doc = await Document.findOne({
        _id: req.params.id,
        ownerId: req.user.userId
      });
      if (!doc)
        return response.notFound(res, { message: 'document not found' });

      //delete the document
      const deleted = await Document.findByIdAndDelete(doc._id);
      return response.success(res, deleted);
    } catch (err) {
      return response.internalError(res, { error });
    }
  }

  /**
   * Method to get a  document by Id
   * @param {object} req
   * @param {object} res
   * @return {object} JSON response
   */
  async getById(req, res) {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc)
        return response.notFound(res, { message: 'document not found' });

      //method is called based on the access type of the document
      const grantAccess = {
        public: () => true,
        private: () => {
          if (doc.ownerId == req.user.userId) return true;
        },
        role: async () => {
          //check if user is an admin and grant access
          const roles = await Role.find();
          const adminRole = roles.find(role => role.title === 'admin');
          if (req.user.roleId == adminRole._id) return true;

          //check if the users role is same as the docOwner's role
          const docOwner = await User.findById(req.user.userId);
          if (docOwner.role == req.user.role) return true;
        }
      };

      if (grantAccess[doc.access]()) return response.success(res, doc);
      return response.unAuthorized(res, {
        message: 'you do not have access to this document'
      });
    } catch (error) {
      return response.internalError(res, { error });
    }
  }
}

module.exports = new Documents();
