import PaymentService from "../service/payment.service.js";


const recordSuccessfulTransaction = async (req, res) => {
  // Assuming a pre-payment middleware has validated the user and the transaction payload
  const { type, amount, issueId, paymentGatewayTxnId } = req.body;
  const userId = req.user.userId;

  if (!type || !amount) {
    return res.status(400).json({ message: "Type and amount are required." });
  }
  
  // Basic validation
  if (type === 'boost' && !issueId) {
    return res.status(400).json({ message: "Issue ID is required for a boost payment." });
  }

  try {
    // 1. Record the transaction in the payments collection
    const result = await PaymentService.createPaymentRecord({
      userId,
      type,
      amount,
      issueId,
      paymentGatewayTxnId: paymentGatewayTxnId || `SIMULATED_TXN_${Date.now()}`,
      status: 'completed',
    });

    // 2. Handle post-payment logic based on type
    if (type === 'subscription') {
      // Update user status to premium
      await PaymentService.updateUserSubscriptionStatus(userId, 'premium');
    }
    
    // NOTE: If type is 'boost', the IssueController.boostIssue should handle
    // the priority change. This payment controller only records the transaction.
    // The successful payment record ID could be passed back to the IssueController.

    return res.status(201).json({
      message: `${type} transaction recorded successfully.`,
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error(`Error processing transaction: ${error}`);
    return res.status(500).json({ message: "An internal server error occurred during transaction recording." });
  }
};


// GET /payments/history (Citizen/Staff)
const getPaymentHistory = async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  try {
    const history = await PaymentService.getUserPaymentHistory(userId, skip, parseInt(limit));
    
    // NOTE: Need a dedicated service to count user's total payments for pagination, 
    // but for simplicity, we'll return the history directly.

    return res.status(200).json({
      data: history,
      message: "Payment history fetched successfully.",
    });
  } catch (error) {
    console.error(`Error fetching payment history: ${error}`);
    return res.status(500).json({ message: "An internal server error occurred while fetching history." });
  }
};


const getAdminReport = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageSize = parseInt(limit);
  const pageNumber = parseInt(page);
  const skip = (pageNumber - 1) * pageSize;

  try {
    const report = await PaymentService.getAdminPaymentReport(skip, pageSize);
    const totalPayments = await PaymentService.getTotalPaymentsCount();
    const totalPages = Math.ceil(totalPayments / pageSize);

    return res.status(200).json({
      data: {
        payments: report,
        currentPage: pageNumber,
        limit: pageSize,
        totalPayments,
        totalPages,
      },
      message: "Admin payment report fetched successfully.",
    });
  } catch (error) {
    console.error(`Error fetching admin report: ${error}`);
    return res.status(500).json({ message: "An internal server error occurred while fetching the report." });
  }
};


const getInvoice = async (req, res) => {
  const { paymentId } = req.params;
  const { userId, role } = req.user;

  if (!paymentId) {
    return res.status(400).json({ message: "Payment ID is required to generate the invoice." });
  }

  try {
    const invoiceData = await PaymentService.getInvoiceDataById(paymentId);

    if (!invoiceData) {
      return res.status(404).json({ message: "Invoice data not found." });
    }

    // Security check: Only the owner or an Admin can fetch the invoice
    if (role !== 'admin' && invoiceData.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to view this invoice." });
    }

    // Since server-side PDF generation logic is complex and dependent on external libraries,
    // we fulfill the requirement by returning the necessary data for client-side PDF generation.
    return res.status(200).json({
      data: invoiceData,
      message: "Invoice data fetched successfully. Use this data to generate the PDF on the client.",
      // Client reference based on PDF requirement: "How to generate PDF in React using React pdf"
    });
  } catch (error) {
    console.error(`Error fetching invoice data: ${error}`);
    return res.status(500).json({ message: "An internal server error occurred while fetching invoice data." });
  }
};

const PaymentController = {
  recordSuccessfulTransaction,
  getPaymentHistory,
  getAdminReport,
  getInvoice,
};

export default PaymentController;