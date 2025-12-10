import { ObjectId, ReturnDocument } from "mongodb";
import connectDb from "../../../db/index.js";

// Get Signle Issue
const getSingleIssue = async (issueId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const issue = await db.collection("issues").findOne({
      _id: issueObjectId,
    });

    return issue;
  } catch (error) {
    throw new Error(`Error fetching single issue: ${error.message}`);
  }
};

// Get Issues
const getIssues = async (filter, skip, limit) => {
  try {
    const db = await connectDb();

    const issues = await db
      .collection("issues")
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ isBoosted: -1, createdAt: -1 }) // Sort by boosted (true first), then by newest
      .toArray();

    return issues;
  } catch (error) {
    throw new Error(`Error fetching issues: ${error.message}`);
  }
};

// Get Issues Count
const getTotalIssues = async (filter = {}) => {
  try {
    const db = await connectDb();

    const issuesCount = await db.collection("issues").countDocuments(filter);

    return issuesCount;
  } catch (error) {
    throw new Error(`Db error during fetching total issues: ${error}`);
  }
};

// Create Issue Report
const createIssue = async (payload, userId) => {
  try {
    const db = await connectDb();

    const newIssue = {
      ...payload,
      reporterId: userId,
      status: "pending",
      priority: payload.priority || "normal",
      upvotes: 0,
      assignedStaffId: null,
      isBoosted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection("issues").insertOne(newIssue);

    return res;
  } catch (error) {
    throw new Error(`Error occurd during create issue: ${error}`);
  }
};

// Create Issue Time line
const createTimelineEntry = async (entryPayload) => {
  try {
    const db = await connectDb();

    const newTimelineEntry = {
      ...entryPayload,
      issueId: new ObjectId(entryPayload.issueId), // Ensure issueId is stored as ObjectId
      timestamp: new Date(),
    };

    const result = await db
      .collection("issueTimelines")
      .insertOne(newTimelineEntry);

    return result;
  } catch (error) {
    console.error(`Error occurred during timeline creation: ${error}`);
    throw new Error(
      `Error occurred during timeline creation: ${error.message || error}`
    );
  }
};

// Upvote Issue
const upvoteIssue = async (issueId, userId) => {
  try {
    const db = await connectDb();

    const issueObjectId = new ObjectId(issueId);
    const userObjectId = new ObjectId(userId);

    const result = await db.collection("issues").findOneAndUpdate(
      {
        _id: issueObjectId,
        reporterId: { $ne: userId },
        upvoters: { $ne: userId },
      },
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvoters: userId },
      },
      { returnDocument: "after" }
    );

    return result.value;
  } catch (error) {
    throw new Error(`Error upvoting issue: ${error.message}`);
  }
};

// Boost Issue Priority
const boostIssuePriority = async (issueId, userId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const result = await db.collection("issues").findOneAndUpdate(
      {
        _id: issueObjectId,
        isBoosted: false,
      },
      {
        $set: {
          priority: "high",
          isBoosted: true,
        },
        $currentDate: { updatedAt: true },
      },
      {
        returnDocument: "after",
      }
    );

    const updatedIssue = result.value;

    if (updatedIssue) {
      await createTimelineEntry({
        issueId: issueObjectId,
        status: updatedIssue.status,
        message: "Issue priority boosted by citizen (Payment successful).",
        updatedBy: "Citizen",
        updatedById: userId,
      });
    }

    return updatedIssue;
  } catch (error) {
    throw new Error(`Error boosting issue: ${error.message}`);
  }
};

// Edit Own Issue
const editOwnIssue = async (issueId, userId, updatePayload) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const result = await db.collection("issues").findOneAndUpdate(
      {
        _id: issueObjectId,
        reporterId: userId,
        status: "pending",
      },
      {
        $set: {
          ...updatePayload,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    return result.value;
  } catch (error) {
    throw new Error(`Error editing issue: ${error.message}`);
  }
};

// delete issue
const deleteOwnIssue = async (issueId, userId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const result = await db.collection("issues").findOneAndDelete({
      _id: issueObjectId,
      reporterId: userId,
    });

    return result.value;
  } catch (error) {
    throw new Error(`Error deleting issue: ${error.message}`);
  }
};

// Issue Time line
const getIssueTimeline = async (issueId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const timeline = await db
      .collection("issueTimelines")
      .find({ issueId: issueObjectId })
      .sort({ timestamp: -1 })
      .toArray();

    return timeline;
  } catch (error) {
    throw new Error(`Error fetching issue timeline: ${error.message}`);
  }
};


const changeIssueStatus = async (issueId, newStatus, updaterId, updaterRole) => {
    try {
        const db = await connectDb();
        const issueObjectId = new ObjectId(issueId);
        
        // 1. Define the filter based on the updater's role for security
        let filter = { _id: issueObjectId };
        
        // SECURITY: If the updater is Staff, restrict the update to only issues assigned to them.
        if (updaterRole.toLowerCase() === 'staff') {
            filter.assignedStaffId = updaterId;
        }
        
        // 2. Update the status
        const result = await db.collection("issues").findOneAndUpdate(
            filter,
            { 
                $set: { status: newStatus },
                $currentDate: { updatedAt: true }
            },
            { returnDocument: 'after' }
        );
        
        const updatedIssue = result.value;

        if (updatedIssue) {
            // 3. Add tracking record (Requirement: Status change must create a timeline entry)
            // Ensure createTimelineEntry is accessible (e.g., exported in this file)
            await createTimelineEntry({
                issueId: issueObjectId,
                status: newStatus, 
                message: `Issue status changed to: ${newStatus}.`,
                updatedBy: updaterRole,
                updatedById: updaterId,
            });
        }

        return updatedIssue;
    } catch (error) {
        throw new Error(`Error changing issue status: ${error.message}`);
    }
};

const IssueService = {
  createIssue,
  getIssues,
  getTotalIssues,
  createTimelineEntry,
  upvoteIssue,
  boostIssuePriority,
  editOwnIssue,
  getSingleIssue,
  getIssueTimeline,
  deleteOwnIssue,
  changeIssueStatus
};

export default IssueService;
