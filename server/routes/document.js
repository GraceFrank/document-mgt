const express = require("express");
const csurf = require("csurf");
const authenticate = require("../middleware/authentication");
const login = require("../middleware/login");
const validateId = require("../middleware/validate-id");
const documentController = require("../controller/documents");

const router = express.Router();

const csurfProtection = csurf({
  cookie: true,
});
router.use(csurfProtection);

router.post("/", authenticate, documentController.post);

router.put("/:id", [validateId, authenticate], documentController.put);

router.get("/", authenticate, documentController.get);

router.delete("/:id", [validateId, authenticate], documentController.delete);

router.get("/:id", [validateId, authenticate], documentController.getById);

//endpoint to get all document authored by a user
router.get("/:userId/documents", authenticate, documentController.getUserDocs);

module.exports = router;
