import { ObjectId } from "mongodb";
import connectDb from "../../db/index.js";

// Get User By Id
const getUserById = async (id) => {
  try {
    const db = await connectDb();

    console.log({userId: id})

    const userId = new ObjectId(id);
    const user = await db.collection("users").findOne({ _id: userId });

    return user;
  } catch (error) {
    console.error("Mongodb error occured during fetching user by id: ", error);
    throw new Error(
      `Mongodb error occured during fetching user by id: ${error}`
    );
  }
};

// Get User By Email
const getUserByEmail = async (email) => {
  try {
    const db = await connectDb();

    const user = await db.collection("users").findOne({ email });

    return user;
  } catch (error) {
    console.error("Mongodb error occured during fetching user: ", error);
    throw new Error(`Mongodb error occured during fetching user: ${error}`);
  }
};

// Get total users
const getTotalUsers = async (filter = {}) => {
  try {
    const db = await connectDb();

    const usersCount = await db.collection("users").countDocuments(filter);

    return usersCount;
  } catch (error) {
    console.error("Db error during fetching total users count: ", error);
    throw new Error(
      `Db error during fetching total users count: ${error.message || error}`
    );
  }
};

// Get All Users
const getUsers = async (page, limit, role, isBlocked) => {
  const filter = {};

  const pageSize = parseInt(limit) || 10;
  const pageNumber = parseInt(page) || 1;
  const skip = (pageNumber - 1) * pageSize;

  if (role) {
    filter.role = role;
  }

  if (typeof isBlocked === "boolean") {
    filter.isBlocked = isBlocked;
  }

  try {
    const db = await connectDb();

    const users = await db
      .collection("users")
      .find(filter)
      .skip(skip)
      .limit(pageSize)
      .toArray();
    return users;
  } catch (error) {
    console.error("Mongodb error occured during fetching users: ", error);
    throw new Error(`Mongodb error occured during fetching users: ${error}`);
  }
};

// Update User
const updateUserProfile = async (payload) => {
  const { name, photoUrl, userId } = payload;

  const updatedObj = {
    $set: {
      name,
      photoUrl,
    },
  };

  const options = {
    upsert: true,
    returnDocument: "after",
  };

  try {
    const db = await connectDb();

    const updatedUser = await db
      .collection("users")
      .findOneAndUpdate({ _id: new ObjectId(userId) }, updatedObj, options);

    return updatedUser;
  } catch (error) {
    throw new Error(`Mongodb error while updating user: ${error}`);
  }
};

// Update Use By Admin
const updateUserByAdmin = async (userId, role, isBlocked, isPremium) => {
  const updatedObj = {};

  if (role) {
    updatedObj.role = role;
  }

  if (isBlocked !== undefined) {
    const status = String(isBlocked).toLowerCase();
    updatedObj.isBlocked = status === "blocked";
  }

  if (isPremium !== undefined) {
    const status = String(isPremium).toLowerCase();
    updatedObj.isPremium = status === "subscribe";
  }

  if (Object.keys(updatedObj).length === 0) {
    return null;
  }

  const updateInstructure = {
    $set: updatedObj,
  };

  const options = {
    upsert: true,
    returnDocument: "after",
  };

  try {
    const db = await connectDb();

    const updatedUser = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        updateInstructure,
        options
      );

    return updatedUser;
  } catch (error) {
    throw new Error(`Error occured while updating user by admin: ${error}`);
  }
};

const UserService = {
  getUserByEmail,
  getUsers,
  getUserById,
  updateUserProfile,
  updateUserByAdmin,
  getTotalUsers,
};

export default UserService;
