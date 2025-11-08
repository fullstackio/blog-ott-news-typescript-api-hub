import Admin from "../../models/admin.model";
import bcrypt from "bcryptjs";
import os from "os";
const JWT = require("jsonwebtoken");
import {
  generateUserId,
  generateUniqueUserId,
  generateOtp,
  getDeviceInfo,
  generateSlug,
} from "../../utils/helper/auth.helper";

export const signUp = async (req: any, res: any) => {
  try {
    const { firstName, lastName, userGender, email, phone, passWord } =
      req.body;

    if (await Admin.findOne({ email })) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User email already exists!",
      });
    }

    if (await Admin.findOne({ phone })) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User phone already exists!",
      });
    }

    const hashedPassword = await bcrypt.hash(passWord, 12);
    const userId = generateUserId(firstName, lastName);
    const uniqueId = generateUniqueUserId();
    const deviceInfo = getDeviceInfo(req);
    const otp = generateOtp();
    const otpExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const slug = generateSlug(firstName, lastName);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };

    const newAdmin = await Admin.create({
      firstName,
      lastName,
      userGender,
      email,
      phone,
      userId,
      uniqueId,
      passWord: hashedPassword,
      deviceInfo,
      slugInfo: slug,
      timeZone: timezone,
      otp,
      otpExpires,
      setSystemServerInfo: serverInfo,
    });

    res.status(201).json({
      status: 201,
      success: true,
      message: "Registration successful",
      data: newAdmin,
      // auth: await newAdmin.generatedAuthToken(),
      // userUId: newAdmin._id.toString(),
    });
    console.log(req.body);
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const signIn = async (req: any, res: any) => {
  try {
    const { email, passWord } = req.body;

    // 1. Validate required fields
    if (!email) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Email is required",
      });
    }

    if (!passWord) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Password is required",
      });
    }

    // Check if user exists
    const isUserExist = await Admin.findOne({ email });

    if (!isUserExist) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "User does not exist!",
      });
    }

    // Check account status
    if (isUserExist.status === "pending") {
      return res.status(403).json({
        status: 403,
        success: false,
        message:
          "Your Email Id is not verified, please check your email for verification.",
      });
    }

    if (isUserExist.status === "blocked" || isUserExist.status === "suspend") {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Your account is suspended, contact support.",
      });
    }

    if (isUserExist.status === "inactive") {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    if (!isUserExist.isActive) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Your account is deactivated. Please activate your account.",
      });
    }

    // Validate password
    const loginUser = await bcrypt.compare(passWord, isUserExist.passWord);
    if (!loginUser) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Invalid email or password",
      });
    }

    // Authenticated successfully
    const userData = {
      user: {
        _id: isUserExist._id,
        firstName: isUserExist.firstName,
        lastName: isUserExist.lastName,
        email: isUserExist.email,
        phone: isUserExist.phone,
        role: isUserExist.role,
        userId: isUserExist.userId,
        uniqueId: isUserExist.uniqueId,
        status: isUserExist.status,
        slug: isUserExist.slugInfo,
        createdAt: isUserExist.createdAt,
        updatedAt: isUserExist.updatedAt,
        isActive: isUserExist.isActive,
        isDeleted: isUserExist.isDeleted,
        sysOtp: isUserExist.otp,
        sysOtpExpire: isUserExist.otpExpires,
      },
      auth: await isUserExist.generatedAuthToken(),
      userUId: isUserExist._id.toString(),
    };

    return res.status(200).json({
      status: 200,
      success: true,
      message: "User Login Successful",
      data: userData,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUsers = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 users per page
    const skip = (page - 1) * limit;

    // Total count of users
    const totalUsers = await Admin.countDocuments({ isDeleted: false });

    // Paginated users
    const users = await Admin.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      total: totalUsers,
      page,
      limit,
      pages: totalPages,
      hasNextPage,
      hasPrevPage,
    };

    if (!users.length) {
      return res.status(200).json({
        status: 200,
        success: false,
        message: "No user data found",
        data: [],
        pagination,
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "User data fetched successfully",
      data: { users },
      pagination,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error from Auth Controller",
    });
  }
};

export const getDraftUsers = async (req: any, res: any) => {
  try {
    const users = await Admin.find({ isDeleted: true }).sort({
      createdAt: -1,
    });

    const adminUsers = {
      users,
    };

    if (!users.length) {
      return res.status(200).json({
        status: 200,
        success: false,
        message: "No user data found",
        data: [],
        totalUserLength: 0,
      });
    }
    console.log(users);
    res.status(200).json({
      status: 200,
      success: true,
      message: "All user data fetched successfully",
      data: adminUsers,
      totalUserLength: users.length,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error from Auth Controller",
    });
  }
};

export const singleUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const user = await Admin.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Single user error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const editUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.passWord) {
      updateData.passWord = await bcrypt.hash(updateData.passWord, 12);
    }

    const updatedUser = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Edit user error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

// Delete User Soft
export const deleteUserSoft = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const deletedUser = await Admin.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedUser) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "User marked as deleted",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

// Delete User hard is isDelete true
export const deleteUserHard = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const user = await Admin.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User must be soft-deleted before hard delete",
      });
    }

    const deletedUser = await Admin.deleteOne({ _id: id });

    if (!deletedUser) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "User deleted permanently",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Hard delete user error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

// Delete User Direct
export const deleteUserDirect = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const deletedUser = await Admin.deleteOne({ _id: id });

    if (!deletedUser) {
      return res
        .status(404)
        .json({ status: 404, success: false, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Your are deleted this user directly & ermanently",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Hard delete user error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const refreshToken = async (req: any, res: any) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is required" });
    }

    const decoded = JWT.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
    const user = await Admin.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // Generate new access token
    const payload = {
      id: user._id.toString(),
      setFirstName: user.firstName,
      setLastName: user.lastName,
      setemail: user.email,
      setUserId: user.userId,
      setUserUniqueId: user.uniqueId,
      setRole: user.role,
      setStatus: user.status,
    };

    const newAccessToken = JWT.sign(payload, process.env.JWT_SECREATE_TOKEN, {
      expiresIn: "15m",
    });

    const newAccessTokenExpireTime = Date.now() + 15 * 60 * 1000;

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
      accessTokenExpireTime: newAccessTokenExpireTime,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({
      success: false,
      message: "Unauthorized or expired refresh token",
    });
  }
};
