import IssueService from "../../issue/service/issue.service.js";


const updateIssueStatus = async (req, res) => {
  // NOTE: This controller assumes 'staffOrAdminAuthMiddleware' runs first
  // and verifies the user has the necessary permissions.
  
  const { issueId } = req.params;
  const { newStatus } = req.body;
  const currentUser = req.user; // Staff or Admin user object

  if (!issueId || !newStatus) {
    return res.status(400).json({
      message: "Issue ID and the new status are required.",
    });
  }
  
  // Basic status validation (You might use an enum/whitelist in a real app)
  const allowedStatuses = ['in-progress', 'working', 'resolved', 'closed', 'pending']; 
  if (!allowedStatuses.includes(newStatus.toLowerCase())) {
     return res.status(400).json({
        message: `Invalid status provided. Must be one of: ${allowedStatuses.join(', ')}`
    });
  }

  try {
    // Call the service to update the status.
    // The service handles: updating the status and creating the timeline entry.
    const updatedIssue = await IssueService.changeIssueStatus(
      issueId,
      newStatus.toLowerCase(),
      currentUser.userId,
      currentUser.role // Pass role for timeline audit (e.g., 'Staff' or 'Admin')
    );

    // If null, the issue was not found.
    if (!updatedIssue) {
        return res.status(404).json({
            message: "Issue not found or update failed.",
        });
    }

    // Send successful response
    return res.status(200).json({
      data: updatedIssue,
      message: `Issue status successfully updated to: ${newStatus}.`,
    });

  } catch (error) {
    console.error(`Error during issue status update: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during status update.",
    });
  }
};


const addProgressUpdate = async (req, res) => {
    // NOTE: This controller assumes 'staffAuthMiddleware' runs first
    // and verifies the currentUser.role === 'staff'.

    const { issueId } = req.params;
    const { message } = req.body;
    const currentUser = req.user;

    if (!issueId || !message || String(message).trim().length === 0) {
        return res.status(400).json({
            message: "Issue ID and a progress message are required.",
        });
    }

    try {
        // 1. Fetch the current issue to get the current status
        const issue = await IssueService.getSingleIssue(issueId);

        if (!issue) {
            return res.status(404).json({ message: "Issue not found." });
        }
        
        // OPTIONAL: Staff should only update issues assigned to them.
        if (issue.assignedStaffId !== currentUser.userId) {
            return res.status(403).json({ message: "Forbidden: You can only update issues assigned to you." });
        }

        // 2. Create a new timeline entry (using the existing status)
        await IssueService.createTimelineEntry({
            issueId: issueId,
            status: issue.status, 
            message: message, // The staff's custom progress message
            updatedBy: 'Staff',
            updatedById: currentUser.userId,
        });

        return res.status(201).json({
            message: "Progress update added to the issue timeline.",
        });

    } catch (error) {
        console.error(`Error adding progress update: ${error}`);
        return res.status(500).json({
            message: "An internal server error occurred while adding the progress update.",
        });
    }
};


const StaffController = {
    updateIssueStatus,
    addProgressUpdate
}


export default StaffController;