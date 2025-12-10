import jwtSign from "../../jwt/index.js";
import UserService from "./user.service.js";

const getCurrentUser = async (req, res) => {
  const user = req?.user;


  try {
    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Remove sensitive data before sending
    const { password, ...userData } = user;

    return res.status(200).json({
      user: userData,
      message: "User fetched successfully.",
    });
  } catch (error) {
    console.error("Error occured during fetching current user: ", error);
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

// Get Users
const getUsers = async (req, res) => {
  const { page, limit, role, isBlocked } = req.query;
  const filter = {}; // Initialize filter for total count

  // Logic to build the filter object (mimicking service logic)
  if (role) {
    filter.role = role;
  }
  // isBlocked from query is a string; must be converted to boolean if present
  if (isBlocked === "true" || isBlocked === "false") {
    filter.isBlocked = isBlocked === "true";
  }

  try {
    const users = await UserService.getUsers(
      page,
      limit,
      role,
      filter.isBlocked
    );

    // Fetch total count for pagination
    const totalUsers = await UserService.getTotalUsers(filter);

    const pageSize = parseInt(limit) || 10;
    const totalPages = Math.ceil(totalUsers / pageSize);

    return res.status(200).json({
      data: {
        users,
        currentPage: parseInt(page) || 1,
        limit: pageSize,
        totalUsers,
        totalPages,
      },
      message: "Users fetched successfully.",
    });
  } catch (error) {
    console.error("Error occured during fetching users: ", error);
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const getUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      message: "Invalid user id or missing.",
    });
  }

  try {
    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { password, ...userData } = user;

    return res.status(200).json({
      user: userData,
      message: "User fetched successfully.",
    });
  } catch (error) {
    console.error("Error occured during fetching user by Id: ", error);
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const getUserByEmail = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  try {
    const user = await UserService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
      message: "User fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateProfile = async (req, res) => {
  const { name, photoUrl } = req.body;
  const userId = req.user.userId; // Use ID from token, not params

  if (!name && !photoUrl) {
    return res.status(400).json({
      message: "At least name or photoUrl must be provided for update.",
    });
  }

  try {
    const updatedUser = await UserService.updateUserProfile({
      name,
      photoUrl,
      userId,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found or update failed." });
    }

    // Remove sensitive data before sending
    const { password, ...userData } = updatedUser;

    return res.status(200).json({
      user: userData,
      message: "User profile updated successfully.",
    });
  } catch (error) {
    console.error(`Error updating user profile: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during profile update.",
    });
  }
};

const updateUserByAdmin = async (req, res) => {
  // Authentication middleware ensures this is an Admin
  const { userId } = req.params;
  const { role } = req.body;
  const { isBlocked, isPremium } = req.query; // Status flags often come in query/body

  if (!userId) {
    return res
      .status(400)
      .json({ message: "User ID is required for admin update." });
  }

  // Ensure at least one field is provided for update
  if (!role && isBlocked === undefined && isPremium === undefined) {
    return res.status(400).json({
      message:
        "At least one field (role, isBlocked, or isPremium) must be provided.",
    });
  }

  try {
    // Service handles the logic for converting strings ('blocked', 'subscribe') to booleans
    const updatedUser = await UserService.updateUserByAdmin(
      userId,
      role,
      isBlocked,
      isPremium
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found or update failed." });
    }

    // Remove sensitive data before sending
    const { password, ...userData } = updatedUser;

    return res.status(200).json({
      user: userData,
      message: "User updated by admin successfully.",
    });
  } catch (error) {
    console.error(`Error updating user by admin: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during admin update.",
    });
  }
};

const addStaff = async (req, res) => {
  // Admin middleware ensures this is an Admin
  const { name, email, password, photoUrl } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email, and password are required for new staff creation.",
    });
  }

  try {
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(
      parseInt(config.BCRYPT_SALT_ROUNDS) || 10
    );
    const hashedPassword = await bcrypt.hash(password, salt);

    // Explicitly set role to 'staff'
    const result = await UserService.createUser({
      name,
      email,
      password: hashedPassword,
      photoUrl,
      role: "staff",
    });

    const newStaff = {
      userId: result.insertedId,
      email,
      role: "staff",
    };

    return res.status(201).json({
      message: "New staff member added successfully.",
      user: newStaff,
    });
  } catch (error) {
    console.error(`Add staff error: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred while adding staff.",
    });
  }
};

const UserController = {
  getUsers,
  getUser,
  updateProfile,
  getCurrentUser,
  updateUserByAdmin,
  addStaff,
  getUserByEmail,
};

export default UserController;
