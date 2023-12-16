const express = require("express");
const multer = require("multer");
const expressFormidable = require("express-formidable");
const {
  getUsers,
  loginController,
  registerController,
  authController,
  addProductsController,
  applySellerController,
  switchVendorToUser,
  switchUserToVendor,
  updateUserProfile,
  createRestaurant,
  verifyOtpController,
} = require("../controllers/user");
const { protect } = require("../middlewares/authMiddleware");
const { imageUploadController } = require("../controllers/ImageUpload");

const router = express.Router();

router.post("/register", registerController);
router.get("/", getUsers);
router.post("/login", loginController);
router.put("/switch-to-vendor/:userId", switchUserToVendor);
router.put("/complete-profile", protect, updateUserProfile);
// Switch vendor to user
router.put("/switch-to-user/:userId", switchVendorToUser);
router.post("/getUserData", protect, authController);
router.post("/addProducts", protect, addProductsController);
router.post("/apply-seller", protect, applySellerController);
router.post("/ApplyRestourant", createRestaurant);
router.post("/verifyotp", verifyOtpController);

router.post(
  "/upload-image",
  expressFormidable({ maxFieldsSize: 5 * 2024 * 2024 }),
  imageUploadController
);

module.exports = router;
