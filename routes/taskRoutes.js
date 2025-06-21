const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const taskController = require('../controllers/tasks');

router.get('/', verifyToken, taskController.getTasks);
router.post('/', verifyToken, taskController.addTasks);
router.post('/:id/complete', verifyToken, taskController.completeTask);

module.exports = router;
