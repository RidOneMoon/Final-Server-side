import UserService from "../../user/user.service.js";
import IssueService from "../service/issue.service.js";

// Get Issues
const getIssues = async (req, res) => {
  const currentUser = req?.user;
  const { page, limit, search, status, category, priority } = req.query;

  const filter = {};
  const pageSize = parseInt(limit) || 10;
  const pageNumber = parseInt(page) || 1;
  const skip = (pageNumber - 1) * pageSize;

  if (currentUser.role === "staff") {
    filter.assignedStaffed = currentUser.userId;
  }

  if (status) {
    filter.status = status;
  }

  if (category) {
    filter.category = category;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (search) {
    const searchRegex = { $regex: search, $options: "i" };

    filter.$or = [
      { title: searchRegex },
      { category: searchRegex },
      { location: searchRegex },
    ];
  }

  try {
    const issues = await IssueService.getIssues(filter, skip, pageSize);

    const totalIssues = await IssueService.getTotalIssues(filter);

    const totalPages = Math.ceil(totalIssues / pageSize);

    return res.status(200).json({
      data: {
        issues,
        currentPage: pageNumber,
        limit: pageSize,
        totalIssues,
        totalPages,
      },
      message: "Issues fetched successfully",
    });
  } catch (error) {
    console.error(`Issue fetching error: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during issue fetching.",
    });
  }
};

// Get Single Issue
const getSingleIssue = async (req, res) => {
  const { issueId } = req.params;

  if (!issueId) {
    return res.status(400).json({
      message: "Issue ID is required to fetch details.",
    });
  }

  try {
    const issue = await IssueService.getSingleIssue(issueId);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found.",
      });
    }

    const timeline = await IssueService.getIssueTimeline(issueId);

    return res.status(200).json({
      data: {
        issue,
        timeline,
      },
      message: "Issue details and timeline fetched successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "An internal server error occurred while fetching issue details.",
    });
  }
};

// Create Issue
const createIssue = async (req, res) => {
  const body = req.body;
  const issuesKeys = Object.keys(body);
  const currentUser = req.user;

  if (
    issuesKeys.some((key) => body[key] === undefined || body[key].length === 0)
  ) {
    return res.status(400).json({
      message: "Create issue required fields must have a valid value",
    });
  }

  try {
    const user = await UserService.getUserById(currentUser.userId);

    const subscriptionStatus = user.subscriptionStatus;

    const totalIssues = await IssueService.getTotalIssues(currentUser.userId);

    if (subscriptionStatus.toLowerCase() == "free" && totalIssues >= 3) {
      return res.status(403).json({
        message: "You have exceeded you free tier",
      });
    }

    const result = await IssueService.createIssue(body);

    const issueId = result._id;

    const timelineEntry = {
      issueId: issueId,
      status: "Pending",
      message: "Issue reported by citizen.",
      updatedBy: "Citizen",
      updatedById: currentUser.userId,
    };

    await IssueService.createTimelineEntry(timelineEntry);

    return res.status(201).json({
      message: "Issue created successfully and tracking initiated.",
      issueId: issueId,
      issue: newIssue,
    });
  } catch (error) {
    console.error(`Issue creation error: ${error}`);
    return res.status(201).json({
      message: "Issue created successfully and tracking initiated.",
      issueId: result.insertedId,
      issue: req.body,
    });
  }
};

// Get Issue time line
const getIssueTimeline = async (req, res) => {
  const { issueId } = req.params;

  if (!issueId) {
    return res.status(400).json({
      message: "Issue ID is required to fetch the timeline.",
    });
  }

  try {
    const timeline = await IssueService.getIssueTimeline(issueId);

    return res.status(200).json({
      data: timeline,
      message: "Issue timeline fetched successfully.",
    });
  } catch (error) {
    console.error(`Error fetching issue timeline: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred while fetching the timeline.",
    });
  }
};

// Upvote
const upvoteIssue = async (req, res) => {
  const { issueId } = req.params;
  const currentUser = req.user;

  if (!issueId) {
    return res.status(400).json({
      message: "Issue ID is required to upvote.",
    });
  }

  try {
    const updatedIssue = await IssueService.upvoteIssue(
      issueId,
      currentUser.userId
    );

    if (!updatedIssue) {
      return res.status(403).json({
        message:
          "Upvote failed: You have either already upvoted this issue or cannot upvote your own issue.",
      });
    }

    return res.status(200).json({
      data: updatedIssue,
      message: "Issue successfully upvoted.",
    });
  } catch (error) {
    console.error(`Error during issue upvote: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during upvote.",
    });
  }
};

// Boost
const boostIssue = async (req, res) => {
  const { issueId } = req.params;
  const currentUser = req.user;

  if (!issueId) {
    return res.status(400).json({
      message: "Issue ID is required to boost priority.",
    });
  }

  try {
    const updatedIssue = await IssueService.boostIssuePriority(
      issueId,
      currentUser.userId
    );

    if (!updatedIssue) {
      return res.status(404).json({
        message: "Issue not found or is already boosted.",
      });
    }

    return res.status(200).json({
      data: updatedIssue,
      message: "Issue priority successfully boosted!",
    });
  } catch (error) {
    console.error(`Error during issue boosting: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during boosting.",
    });
  }
};

// Edit Issue
const editOwnIssue = async (req, res) => {
  const { issueId } = req.params;
  const updatePayload = req.body;
  const currentUser = req.user;

  if (!issueId) {
    return res.status(400).json({
      message: "Issue ID is required for editing.",
    });
  }

  if (Object.keys(updatePayload).length === 0) {
    return res.status(400).json({
      message: "Update fields are required.",
    });
  }

  try {
    const updatedIssue = await IssueService.editOwnIssue(
      issueId,
      currentUser.userId,
      updatePayload
    );

    if (!updatedIssue) {
      return res.status(403).json({
        message:
          "Action forbidden: Issue not found, or only 'pending' issues can be edited by the reporter.",
      });
    }

    return res.status(200).json({
      data: updatedIssue,
      message: "Issue successfully updated.",
    });
  } catch (error) {
    console.error(`Error during issue update: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during issue update.",
    });
  }
};


// delete issue
const deleteOwnIssue = async (req, res) => {
  const { issueId } = req.params;
  const currentUser = req.user;

  if (!issueId) {
    return res.status(400).json({
      message: "Issue ID is required for deletion.",
    });
  }

  try {
    const deletedIssue = await IssueService.deleteOwnIssue(
      issueId,
      currentUser.userId
    );

    if (!deletedIssue) {
      return res.status(403).json({
        message:
          "Action forbidden: Issue not found, or only 'pending' issues can be deleted by the reporter.",
      });
    }

    return res.status(200).json({
      data: deletedIssue,
      message: `Issue "${deletedIssue.title}" successfully deleted.`,
    });
  } catch (error) {
    console.error(`Error during issue deletion: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during issue deletion.",
    });
  }
};


const updateIssueStatus = async (req, res) => {
  // Assuming 'staffOrAdminAuthMiddleware' ensures role is 'staff' or 'admin'
  
  const { issueId } = req.params;
  const { newStatus } = req.body;
  const currentUser = req.user; 

  if (!issueId || !newStatus) {
    return res.status(400).json({
      message: "Issue ID and the new status are required.",
    });
  }
  
  // Basic status validation
  const allowedStatuses = ['in-progress', 'working', 'resolved', 'closed', 'pending']; 
  if (!allowedStatuses.includes(newStatus.toLowerCase())) {
     return res.status(400).json({
        message: `Invalid status provided. Must be one of: ${allowedStatuses.join(', ')}`
    });
  }

  try {
    // 1. Call the service to update the status and create the timeline entry.
    // The service handles ownership/assignment checks implicitly via the database filter.
    const updatedIssue = await IssueService.changeIssueStatus(
      issueId,
      newStatus.toLowerCase(),
      currentUser.userId,
      currentUser.role // Pass role for timeline audit ('Staff' or 'Admin')
    );

    if (!updatedIssue) {
        // This likely means the issue was not found, or in the Staff case, 
        // it was not assigned to them (if the service includes that check).
        return res.status(404).json({
            message: "Issue not found or update failed (Check assignment status).",
        });
    }

    // 2. Send successful response
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
    // Assuming 'staffAuthMiddleware' runs first and verifies role === 'staff'
    
    const { issueId } = req.params;
    const { message } = req.body; // The staff's progress note
    const currentUser = req.user;

    if (!issueId || !message || String(message).trim().length === 0) {
        return res.status(400).json({
            message: "Issue ID and a progress message are required.",
        });
    }

    try {
        // 1. Fetch the current issue to get the current status and check assignment
        const issue = await IssueService.getSingleIssue(issueId);

        if (!issue) {
            return res.status(404).json({ message: "Issue not found." });
        }
        
        // SECURITY: Staff should only update issues assigned to them.
        if (issue.assignedStaffId !== currentUser.userId) {
            return res.status(403).json({ 
                message: "Forbidden: You can only add progress updates to issues assigned to you." 
            });
        }

        // 2. Create a new timeline entry (using the existing status)
        // Ensure createTimelineEntry is accessible via IssueService
        await IssueService.createTimelineEntry({
            issueId: issueId,
            status: issue.status, // Use the current status
            message: message, 
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

const IssueController = {
  createIssue,
  getIssues,
  getSingleIssue,
  getIssueTimeline,
  upvoteIssue,
  boostIssue,
  editOwnIssue,
  deleteOwnIssue,
  updateIssueStatus,
  addProgressUpdate
};

export default IssueController;
