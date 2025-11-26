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
    const {
      firstName,
      lastName,
      userGender,
      email,
      phone,
      passWord,
      country,
      state,
      city,
      address,
      dob,
    } = req.body;

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
    // const otpExpires = Date.now() + 30 * 1000; // 30 Seconds
    const otpExpires = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    const slug = generateSlug(firstName, lastName);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Calculate age from dob if provided
    const calculateAge = (dateLike: any) => {
      if (!dateLike) return undefined;
      const birth = new Date(dateLike);
      if (isNaN(birth.getTime())) return undefined;
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const age = calculateAge(dob);

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
      country,
      state,
      city,
      address,
      dob,
      age,
      userId,
      uniqueId,
      passWord: hashedPassword,
      deviceInfo,
      slugInfo: slug,
      timeZone: timezone,
      otp,
      otpExpires,
      setSystemServerInfo: serverInfo,
      // Use _id for refreshToken payload for consistency
      // Will be set after creation below
    });

    // Set refreshToken after _id is available
    newAdmin.refreshToken = JWT.sign(
      { id: newAdmin._id },
      process.env.JWT_REFRESH_TOKEN,
      {
        expiresIn: "7d",
      }
    );
    await newAdmin.save();

    // Send OTP email after successful signup
    try {
      const { sendOtpMail } = require("../../services/mailer/otpMail.service");
      await sendOtpMail({
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        otp: newAdmin.otp,
        otpExpires: newAdmin.otpExpires,
        timeZone: newAdmin.timeZone,
      });
    } catch (mailError) {
      console.error("Error sending OTP email:", mailError);
    }

    res.status(201).json({
      status: 201,
      success: true,
      message: "Registration successful",
      data: {
        user: {
          _id: newAdmin._id,
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName,
          email: newAdmin.email,
          phone: newAdmin.phone,
          role: newAdmin.role,
          userId: newAdmin.userId,
          uniqueId: newAdmin.uniqueId,
          status: newAdmin.status,
          slug: newAdmin.slugInfo,
          createdAt: newAdmin.createdAt,
          updatedAt: newAdmin.updatedAt,
          isActive: newAdmin.isActive,
          isDeleted: newAdmin.isDeleted,
          sysOtp: newAdmin.otp,
          sysOtpExpire: newAdmin.otpExpires,
        },
        auth: {
          token:
            typeof newAdmin.generatedAuthToken === "function"
              ? await newAdmin.generatedAuthToken()
              : undefined,
          refreshToken: newAdmin.refreshToken,
        },
        userUId: newAdmin._id.toString(),
      },
    });
    console.log(req.body);
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .json({ status: 500, success: false, message: "Internal Server Error" });
  }
};

export const verifyOtp = async (req: any, res: any) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Email and OTP are required",
      });
    }
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
      });
    }
    // Use otp and otpExpires for verification
    if (String(user.otp) !== String(otp)) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Invalid OTP",
      });
    }
    // otpExpires can be a string or Date, so convert to timestamp safely
    const otpExpireTime = user.otpExpires
      ? new Date(user.otpExpires).getTime()
      : 0;
    if (!user.otpExpires || Date.now() > otpExpireTime) {
      return res.status(410).json({
        status: 410,
        success: false,
        message: "OTP expired",
      });
    }
    // Update all relevant fields
    user.isActive = true;
    user.status = "active";
    user.otp = undefined;
    user.otpExpires = undefined;
    user.updatedAt = new Date();
    await user.save();

    // Send response first
    res.status(200).json({
      status: 200,
      success: true,
      message: "OTP verified, account activated. Welcome mail sent.",
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userId: user.userId,
        uniqueId: user.uniqueId,
        status: user.status,
        slug: user.slugInfo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        isDeleted: user.isDeleted,
        otp: user.otp,
        otpExpires: user.otpExpires,
      },
    });

    // Send welcome mail after response using welcomeMail.service
    setImmediate(() => {
      try {
        const {
          sendWelcomeMail,
        } = require("../../services/mailer/welcomeMail.service");
        sendWelcomeMail({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userId: user.userId,
        });
      } catch (mailError) {
        console.error("Error sending welcome mail:", mailError);
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
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
    // Always issue a new refresh token and access token on login
    const refreshTokenExpireTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const authTokenExpireTime = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Generate tokens
    const payload = {
      id: isUserExist._id.toString(),
      setFirstName: isUserExist.firstName,
      setLastName: isUserExist.lastName,
      setemail: isUserExist.email,
      setUserId: isUserExist.userId,
      setUserUniqueId: isUserExist.uniqueId,
      setRole: isUserExist.role,
      setStatus: isUserExist.status,
    };

    const accessToken = JWT.sign(payload, process.env.JWT_SECREATE_TOKEN, {
      expiresIn: authTokenExpireTime,
    });
    const refreshToken = JWT.sign(
      { id: isUserExist._id },
      process.env.JWT_REFRESH_TOKEN,
      {
        expiresIn: refreshTokenExpireTime,
      }
    );

    isUserExist.refreshToken = refreshToken;
    isUserExist.authToken = accessToken;
    isUserExist.refreshTokenExpireTime = refreshTokenExpireTime;
    isUserExist.authTokenExpireTime = authTokenExpireTime;
    await isUserExist.save();

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
        authToken: isUserExist.authToken,
        refreshToken: isUserExist.refreshToken,
        authTokenExpireTime: isUserExist.authTokenExpireTime,
        refreshTokenExpireTime: isUserExist.refreshTokenExpireTime,
      },
      auth: {
        token: accessToken,
        refreshToken: refreshToken,
        authTokenExpireTime,
        refreshTokenExpireTime,
      },
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

    let decoded;
    try {
      decoded = JWT.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
    } catch (err) {
      console.error("JWT verify error:", err);
      return res.status(401).json({
        success: false,
        message: "Unauthorized or expired refresh token",
      });
    }
    const user = await Admin.findById(decoded.id);
    console.log("RefreshToken debug:", {
      decoded,
      userId: decoded.id,
      userFound: !!user,
      storedRefreshToken: user?.refreshToken,
      providedRefreshToken: refreshToken,
    });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found for this refresh token. Please login again.",
      });
    }
    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message:
          "Refresh token does not match the latest token for this user. Please use the token returned after login/signup.",
      });
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

    // Update user document with new access token and expiry
    user.authToken = newAccessToken;
    user.authTokenExpireTime = newAccessTokenExpireTime;
    await user.save();

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

export const recheckEmail = async (req: any, res: any) => {
  try {
    const { email, userId } = req.body;
    if (!email || !userId) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Email and userId are required",
      });
    }
    const user = await Admin.findOne({ email, userId });
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found with provided email and userId",
      });
    }

    // Check account status using user object
    if (user.status === "pending") {
      return res.status(403).json({
        status: 403,
        success: false,
        message:
          "Your Email Id is not verified, please check your email for verification.",
      });
    }

    if (user.status === "blocked" || user.status === "suspend") {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Your account is suspended, contact support.",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Please activate your account.",
      });
    }
    // Generate new OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpires = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    user.otp = otp;
    user.otpExpires = new Date(otpExpires);
    await user.save();
    // Send OTP email
    try {
      const { sendOtpMail } = require("../../services/mailer/otpMail.service");
      await sendOtpMail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        otp: user.otp,
        otpExpires: user.otpExpires,
        timeZone: user.timeZone,
      });
    } catch (mailError) {
      console.error("Error sending OTP email:", mailError);
    }
    return res.status(200).json({
      status: 200,
      success: true,
      message: "OTP sent to registered email",
    });
  } catch (error) {
    console.error("recheckEmail error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
    });
  }
};
