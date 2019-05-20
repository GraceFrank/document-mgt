const swaggerUi = require('swagger-ui-express');
const jsDocs = require('swagger-jsdoc');
const express = require('express');
const router = express.Router();

const options = {
  swaggerDefinition: {
    info: {
      title: 'Gdocs Document Management Systems',
      version: '1.1.0',
      description: 'An online document management system where users can c',
      contact: { email: 'frank.grace7@yahoo.com', phone: '+2348137038977' }
    },
    tags: [
      { name: 'doc', description: 'Everything about the users' },
      { name: 'User', description: 'Everything about the users' },
      { name: 'User Login', description: 'user Login' }
    ]
  },
  apis: ['./documentation/*.yaml']
};

const spec = jsDocs(options);

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec));

// export default function(app) {
//   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
//

module.exports = router;
