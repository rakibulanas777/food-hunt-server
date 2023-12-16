const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: "dvge54a7y",
  api_key: "814112917791111",
  api_secret: "lk-p8lmWK8j2eA0XN8M2vd0gjKU",
});

const imageUploadController = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.files.image.path);
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { imageUploadController };
