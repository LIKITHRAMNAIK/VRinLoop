const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const {
  addTransaction,
  extendTransaction,
  getTransactions,
  getDashboard,
  getByDateRange,
  markAsPaid,
  getByPerson,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

console.log("CONTROLLER:", transactionController);
router.post('/add', transactionController.addTransaction);
router.put('/extend/:id', transactionController.extendTransaction);
router.get('/', transactionController.getTransactions);
router.get('/dashboard', transactionController.getDashboard);
router.get('/range', transactionController.getByDateRange);
router.put('/paid/:id', transactionController.markAsPaid);
router.get('/person/:name', transactionController.getByPerson);
router.put('/update/:id', transactionController.updateTransaction);
router.delete('/delete/:id', transactionController.deleteTransaction);
router.get('/transactions', controller.getTransactions);


module.exports = router;