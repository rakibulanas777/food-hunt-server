const bcrypt = require("bcrypt");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Products = require("../models/Food");
const Restaurant = require("../models/Resturant");

const registerController = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(200).send({
        message: "User Already Exist",
        success: false,
      });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    req.body.password = hashPassword;

    const confrimHashPassword = await bcrypt.hash(
      req.body.passwordConfrim,
      salt
    );
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCase: false,
      specialChars: false,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });
    req.body.passwordConfrim = confrimHashPassword;

    if (req.body.password === req.body.passwordConfrim) {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        profileImage: req.body.profileImage,
        password: req.body.password,
        passwordConfrim: req.body.passwordConfrim,
        otp: otp,
      });
      await newUser.save();

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      const transporter = nodemailer.createTransport({
        // host: "sandbox.smtp.mailtrap.io",
        // port: 25,
        // auth: {
        //   user: "d490071e311337",
        //   pass: "ff9e6e9a515fac",
        // },
        service: "Gmail",
        auth: {
          user: "rakibulanas777@gmail.com",
          pass: "ldozbvhjhmomvink",
        },
      });

      // Send OTP email
      const mailOptions = {
        from: "Food hut <rakibulanas777@gmail.com>",
        to: req.body.email,
        subject: "OTP for Email Verification",
        text: `Your OTP for email verification is: ${otp}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Error sending email.");
        }

        res.send({
          message: "OTP sent to your email.",
        });
      });

      return res.status(201).send({
        message: "Register Successfully",
        data: {
          user: newUser,
          token,
        },
        success: true,
      });
    } else {
      return res
        .status(200)
        .send({ message: "Password does not match", success: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Register controller ${error.message}`,
    });
  }
};

const verifyOtpController = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user.otp === req.body.combinedOtp) {
      user.isVerified = true;
      await user.save();
      res.status(200).json({ message: "Otp veified", success: true });
    } else {
      res.status(200).json({ message: "Wrong Otp", success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginController = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );
    if (!user) {
      return res.status(200).send({
        message: "User not found",
        success: false,
      });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    const signuser = await User.findOne({ email: req.body.email });
    if (!isMatch) {
      return res.status(200).send({
        message: "Invalid email and password",
        success: false,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).send({
      message: "Login Successfully",
      data: {
        user: signuser,
        token,
      },
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Register controller ${error.message}`,
    });
  }
};
const switchUserToVendor = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    const token = jwt.sign({ id: req.body.userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's role to 'vendor'
    user.role = "vendor";
    await user.save();

    res.status(200).json({
      message: "You are now switch as a vendor",
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const switchVendorToUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const vendor = await User.findById(userId);
    const token = jwt.sign({ id: req.body.userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Update the vendor's role to 'user'
    vendor.role = "user";
    await vendor.save();

    res.status(200).json({
      message: "You are now switched as a user",
      success: true,
      data: {
        user: vendor,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const applySellerController = async (req, res) => {
  try {
    const newSeller = await User.findOne({ _id: req.body.userId });
    const token = jwt.sign({ id: req.body.userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    await User.findByIdAndUpdate(newSeller._id, { isSeller: req.body.checked });
    if (req.body.checked === true) {
      return res.status(201).send({
        message: `switch as a buyer`,
        success: true,
        data: {
          user: newSeller,
          token,
        },
      });
    } else {
      return res.status(201).send({
        message: `switch as a seller`,
        success: true,
        data: {
          user: newSeller,
          token,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Error while switching seller`,
    });
  }
};
const addProductsController = async (req, res) => {
  try {
    console.log(req.body);
    const newProduct = new Products(req.body);
    const saveProduct = await newProduct.save();
    return res
      .status(200)
      .send({ message: "Product added successfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Error while switching seller`,
    });
  }
};

const authController = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    if (!user) {
      return res.status(200).send({
        message: "User not found",
        success: false,
      });
    } else {
      console.log(user);
      return res.status(200).send({
        message: "Register Successfully",
        data: {
          user,
        },
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Auth error`,
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const { owner, name, description, cover, location } = req.body;
    const existingApplication = await Restaurant.findOne({
      owner,
      name,
      location,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied to this restaurant",
        success: false,
      });
    }

    const newRestaurant = new Restaurant({
      owner,
      name,
      description,
      cover,
      location,
    });

    const savedRestaurant = await newRestaurant.save();

    res.status(200).send({
      message: "Restaurant application sent",
      data: {
        data: savedRestaurant,
      },
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  if (req.query.email) {
    const search = req.query.email;
    const matched = users.filter((user) => user.email.includes(search));
    res.status(200).json(matched);
  } else {
    res.status(200).json(users);
  }
  next();
});

const protect = catchAsync(async (req, res, next) => {
  let token;

  token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return next(
      new AppError("You are not logged in ! Please log in to get access", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError("User recently changed password! Please log in again.", 401)
  //   );
  // }
  req.user = currentUser;
  next();
});

// Update user profile
const updateUserProfile = async (req, res) => {
  const { name, address, bankAccount, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.address = address || user.address;
    user.bankAccount = bankAccount || user.bankAccount;

    await user.save();

    res
      .status(200)
      .json({ message: "User profile updated successfully", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUsers,
  applySellerController,
  addProductsController,
  loginController,
  authController,
  updateUserProfile,
  registerController,
  protect,
  verifyOtpController,
  switchUserToVendor,
  switchVendorToUser,
  createRestaurant,
};
