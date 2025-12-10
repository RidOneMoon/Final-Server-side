import IssueService from "../../issue/service/issue.service.js";

const assignStaff = async (req, res) => {
  const { issueId } = req.params;
  const { staffId } = req.body;
  const currentUser = req.user;

  if (!issueId || !staffId) {
    return res.status(400).json({
      message: "Issue ID and Staff ID are required for assignment.",
    });
  }

  try {
    const updatedIssue = await IssueService.assignStaff(
      issueId,
      staffId,
      currentUser.userId
    );

    if (!updatedIssue) {
      return res.status(409).json({
        message:
          "Assignment failed: Issue not found, or it is not in a 'pending' state ready for assignment.",
      });
    }

    return res.status(200).json({
      data: updatedIssue,
      message: `Staff ${staffId} successfully assigned to issue.`,
    });
  } catch (error) {
    console.error(`Error during staff assignment: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during staff assignment.",
    });
  }
};

const rejectIssue = async (req, res) => {
  // NOTE: This controller assumes 'adminAuthMiddleware' runs first
  // and verifies the currentUser.role === 'admin'.

  const { issueId } = req.params;
  const currentUser = req.user; // Admin's user object

  if (!issueId) {
    return res.status(400).json({
      message: "Issue ID is required for rejection.",
    });
  }

  try {
    // Call the service to update the status to 'rejected' and create a timeline entry.
    const updatedIssue = await IssueService.rejectIssue(
      issueId,
      currentUser.userId
    );

    // If null, the issue was likely already processed (assigned, resolved, etc.) or not found.
    if (!updatedIssue) {
      return res.status(409).json({
        message:
          "Rejection failed: Issue not found, or it is not in a 'pending' state.",
      });
    }

    // Send successful response
    return res.status(200).json({
      data: updatedIssue,
      message: `Issue successfully rejected.`,
    });
  } catch (error) {
    console.error(`Error during issue rejection: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during rejection.",
    });
  }
};



const AdminController = {
    assignStaff,
    rejectIssue
}

export default AdminController;