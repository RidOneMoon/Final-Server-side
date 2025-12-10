import connectDb from "../../../db/index.js";

// Create User
const signUp = async (userData) => {
  try {
    const db = await connectDb();
    const newUser = {
      ...userData,
      role: userData.role || "citizen", 
      subscriptionStatus: userData.subscriptionStatus || "free", 
      isBlocked: false, 
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

    return result;
  } catch (error) {
    console.error("Mongodb error occurred during user creation: ", error);
    throw new Error(
      `Mongodb error occurred during user creation: ${error.message || error}`
    );
  }
};

const AuthService = {
  signUp,
};

export default AuthService;
