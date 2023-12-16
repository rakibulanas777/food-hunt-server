const Restaurant = require("./path-to-your-model"); // Adjust the path accordingly

// Controller function to handle the creation of a new restaurant
const createRestaurant = async (req, res) => {
  try {
    const { name, description, cover, location } = req.body;

    const newRestaurant = new Restaurant({
      name,
      description,
      cover,
      location,
    });
    const savedRestaurant = await newRestaurant.save();

    res.status(200).send({
      message: "Restourant application send",
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

// Add more controller functions as needed

module.exports = {
  createRestaurant,
  // Add other functions here
};
