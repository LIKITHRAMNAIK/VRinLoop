const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

const authMiddleware =
  require(
    '../middleware/authMiddleware'
  );

console.log("CONTROLLER:", transactionController);
router.post('/add',authMiddleware, transactionController.addTransaction);
router.put('/extend/:id', authMiddleware, transactionController.extendTransaction);
router.get('/', authMiddleware, transactionController.getTransactions);
router.get('/dashboard', authMiddleware, transactionController.getDashboard);
router.get('/range', authMiddleware, transactionController.getByDateRange);
router.put('/paid/:id', authMiddleware, transactionController.markAsPaid);
router.get('/person/:name', authMiddleware, transactionController.getByPerson);
router.put('/update/:id', authMiddleware, transactionController.updateTransaction);
router.delete('/delete/:id', authMiddleware, transactionController.deleteTransaction);
// router.get('/transactions', controller.getTransactions);
router.put(
  '/loan-emi/:id',
  authMiddleware,
  transactionController.payLoanEmi
);
router.put(
  '/loan-history-date',
  authMiddleware,
  transactionController.updateLoanHistoryDate
);

module.exports = router;