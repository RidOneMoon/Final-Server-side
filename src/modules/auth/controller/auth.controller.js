import UserService from "../../user/user.service.js";
import AuthService from "../service/auth.service.js";
import jwtSign from "../../../jwt/index.js";

// SignIn User
const signIn = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const user = await UserService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "Invalid credentials." });
    }

    // Prepare token payload (do not include password or _id)
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      isBlocked: user.isBlocked,
    };

    const token = jwtSign({user: tokenPayload} );

    return res.status(200).json({
      message: "Login successful.",
      user: tokenPayload,
      token,
    });
  } catch (error) {
    console.error(`Login error: ${error}`);
    return res
      .status(500)
      .json({ message: "An internal server error occurred during login." });
  }
};

// SignUp User
// Create User
const signUp = async (req, res) => {
  const { name, email, photoUrl } = req.body;

  console.log({body: req.body})

  if (!name || !email || !photoUrl) {
    return res.status(400).json({
      message: "Name, email, and password are required for registration.",
    });
  }


  try {
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists.",
      });
    }
    // Create user in DB (Service handles role: 'citizen' default)
    const result = await AuthService.signUp({
      name,
      email,
      photoUrl,
    });

    const newUser = {
      userId: result.insertedId,
      email,
      role: "citizen",
      subscriptionStatus: "free",
    };
    const token = jwtSign({ user: newUser });

    return res.status(201).json({
      message: "User registered successfully.",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error(`Registration error: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during registration.",
    });
  }
};

const AuthController = {
  signIn,
  signUp,
};

export default AuthController;
