


const createPaymentRecord = async (payload) => {
  try {
    const db = await connectDb();

    const newPayment = {
      ...payload,
      userId: new ObjectId(payload.userId),
      issueId: payload.issueId ? new ObjectId(payload.issueId) : null,
      timestamp: new Date(),
      status: payload.status || 'completed', 
    };

    const result = await db.collection("payments").insertOne(newPayment);

    return result;
  } catch (error) {
    throw new Error(`Error recording payment: ${error.message}`);
  }
};


const updateUserSubscriptionStatus = async (userId, newSubscriptionStatus) => {
    try {
        const db = await connectDb();
        const userObjectId = new ObjectId(userId);
        
        const updatePayload = {
            $set: {
                subscriptionStatus: newSubscriptionStatus,
                updatedAt: new Date(),
            }
        };

        const result = await db.collection("users").findOneAndUpdate(
            { _id: userObjectId },
            updatePayload,
            { returnDocument: 'after' }
        );

        return result.value;
    } catch (error) {
        throw new Error(`Error updating subscription status: ${error.message}`);
    }
};


const getUserPaymentHistory = async (userId, skip = 0, limit = 10) => {
  try {
    const db = await connectDb();
    const userObjectId = new ObjectId(userId);

    const history = await db.collection("payments")
      .find({ userId: userObjectId, status: 'completed' })
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 }) 
      .toArray();

    return history;
  } catch (error) {
    throw new Error(`Error fetching payment history: ${error.message}`);
  }
};


const getAdminPaymentReport = async (skip = 0, limit = 10) => {
  try {
    const db = await connectDb();

    const report = await db.collection("payments")
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 })
      .toArray();

    return report;
  } catch (error) {
    throw new Error(`Error fetching admin payment report: ${error.message}`);
  }
};


const getTotalPaymentsCount = async () => {
  try {
    const db = await connectDb();

    const count = await db.collection("payments").countDocuments({ status: 'completed' });

    return count;
  } catch (error) {
    throw new Error(`Error fetching total payment count: ${error.message}`);
  }
};


const getInvoiceDataById = async (paymentId) => {
  try {
    const db = await connectDb();
    const paymentObjectId = new ObjectId(paymentId);

    // Use aggregation to join payment data with user data
    const invoiceData = await db.collection("payments").aggregate([
      {
        $match: {
          _id: paymentObjectId,
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: "users", // Name of the user collection
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 0,
          invoiceNumber: { $toString: "$_id" },
          date: "$timestamp",
          amount: "$amount",
          type: "$type",
          issueId: "$issueId",
          paymentGatewayTxnId: "$paymentGatewayTxnId",
          userName: "$userDetails.name",
          userEmail: "$userDetails.email",
          userSubscriptionStatus: "$userDetails.subscriptionStatus",
        }
      }
    ]).toArray();

    return invoiceData[0] || null;

  } catch (error) {
    throw new Error(`Error fetching invoice data: ${error.message}`);
  }
};

const PaymentService = {
    createPaymentRecord,
    updateUserSubscriptionStatus,
    getUserPaymentHistory,
    getAdminPaymentReport,
    getTotalPaymentsCount,
    getInvoiceDataById
}


export default PaymentService;