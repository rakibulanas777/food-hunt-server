const Products = require("../models/Products");
const Bid = require("../models/Bids");
const createProduct = async (req, res, next) => {
  const newProduct = new Products(req.body);
  const saveProduct = await newProduct.save();
  res.status(200).json(saveProduct);

  next();
};

const deleteProduct = async (req, res) => {
  try {
    await Products.findByIdAndDelete(req.params.id);
    return res.status(201).send({
      message: `Product has been deleted.`,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `You are not autorized`,
    });
  }
};

const getProductsController = async (req, res) => {
  try {
    const products = await Products.find({ status: "active" }).populate(
      "vendor"
    );

    const productsWithBids = await Promise.all(
      products.map(async (product) => {
        const bidCount = await Bid.countDocuments({
          product: product._id,
        }).populate("vendor");
        return { ...product._doc, bidCount }; // Merge bid count into product data
      })
    );

    return res.status(201).send({
      message: `all products`,
      success: true,
      data: {
        products: productsWithBids,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `You are not autorized`,
    });
  }
};

const markDelivered = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Products.findById(productId).populate("winner");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.delivered) {
      return res
        .status(400)
        .json({ message: "Product already marked as delivered" });
    }

    product.delivered = true;
    await product.save();

    res.status(200).json({ message: "Product marked as delivered" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getProductController = async (req, res) => {
  try {
    const products = await Products.find({ userId: req.body.userId });

    return res.status(201).send({
      message: `your products`,
      success: true,
      data: {
        products,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `You are not autorized`,
    });
  }
};

const getProductsForUserBids = async (req, res) => {
  try {
    const { userId } = req.params;
    const val = req.query.status;
    const userBids = await Bid.find({ user: userId });
    const productIds = userBids.map((bid) => bid.product);
    if (val === "winproduct") {
      const wonProducts = await Products.find({ winner: userId });
      const productsWithBids = await Promise.all(
        wonProducts.map(async (product) => {
          const bidCount = await Bid.countDocuments({ product: product._id });
          return { ...product._doc, bidCount };
        })
      );

      res.status(200).json({
        message: `all products`,
        success: true,
        data: {
          products: productsWithBids,
        },
      });
    } else if (val === "complete") {
      const wonProducts = await Products.find({
        winner: userId,
        delivered: true,
      });
      const productsWithBids = await Promise.all(
        wonProducts.map(async (product) => {
          const bidCount = await Bid.countDocuments({ product: product._id });
          return { ...product._doc, bidCount };
        })
      );

      res.status(200).json({
        message: `all products`,
        success: true,
        data: {
          products: productsWithBids,
        },
      });
    } else {
      const products = await Products.find({
        _id: { $in: productIds },
        status: val,
      });
      const productsWithBids = await Promise.all(
        products.map(async (product) => {
          const bidCount = await Bid.countDocuments({ product: product._id });
          return { ...product._doc, bidCount };
        })
      );
      res.status(200).json({
        message: `all products`,
        success: true,
        data: {
          products: productsWithBids,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getNewProducts = async (req, res) => {
  try {
    const products = await Products.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(8);
    const productsWithBids = await Promise.all(
      products.map(async (product) => {
        const bidCount = await Bid.countDocuments({ product: product._id });
        return { ...product._doc, bidCount }; // Merge bid count into product data
      })
    );
    res.status(200).json({
      message: `your products`,
      success: true,
      data: {
        products: productsWithBids,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getMostBidsProducts = async (req, res) => {
  try {
    const mostBidsProducts = await Products.find({
      bidCount: { $gt: 0 },
    })
      .sort({ bidCount: -1 })
      .limit(4);
    const productsWithBids = await Promise.all(
      mostBidsProducts.map(async (product) => {
        const bidCount = await Bid.countDocuments({ product: product._id });
        return { ...product._doc, bidCount }; // Merge bid count into product data
      })
    );
    res.status(200).json({
      message: `your products`,
      success: true,
      data: {
        products: productsWithBids,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getEndingSoonProducts = async (req, res) => {
  try {
    const currentDateTime = new Date();

    const endTimeRange = new Date(currentDateTime);
    endTimeRange.setHours(currentDateTime.getHours() + 24);

    const endingSoonProducts = await Products.find({ status: "active" })
      .sort({ endTime: 1 }) // Sort by endTime in ascending order
      .limit(4);

    const productsWithBids = await Promise.all(
      endingSoonProducts.map(async (product) => {
        const bidCount = await Bid.countDocuments({ product: product._id });
        return { ...product._doc, bidCount }; // Merge bid count into product data
      })
    );
    res.status(200).json({
      message: `your products`,
      success: true,
      data: {
        products: productsWithBids,
      },
    });
  } catch (error) {
    console.error("Error fetching ending soon products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    // Assuming the category is passed as a parameter in

    if (category === "all") {
      const categoryProducts = await Products.find({ status: "active" });
      const productsWithCatagory = await Promise.all(
        categoryProducts.map(async (product) => {
          const bidCount = await Bid.countDocuments({ product: product._id });
          return { ...product._doc, bidCount }; // Merge bid count into product data
        })
      );
      res.status(200).json({
        message: `your products`,
        success: true,
        data: {
          products: productsWithCatagory,
        },
      });
    } else {
      const categoryProducts = await Products.find({
        catagory: category,
        status: "active",
      });

      const productsWithCatagory = await Promise.all(
        categoryProducts.map(async (product) => {
          const bidCount = await Bid.countDocuments({ product: product._id });
          return { ...product._doc, bidCount }; // Merge bid count into product data
        })
      );
      res.status(200).json({
        message: `your products`,
        success: true,
        data: {
          products: productsWithCatagory,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching ending soon products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updatedproduct = await Products.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return res.status(201).send({
      message: `your products`,
      success: true,
      data: {
        products: updatedproduct,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `You are not autorized`,
    });
  }
};
const pauseProduct = async (req, res) => {
  try {
    const pauseproduct = await Products.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "paused" } },
      { new: true }
    );
    return res.status(201).send({
      message: `your products`,
      success: true,
      data: {
        products: pauseproduct,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `You are not autorized`,
    });
  }
};
const activeProduct = async (req, res) => {
  try {
    const activeproduct = await Products.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "active" } },
      { new: true }
    );
    return res.status(201).send({
      message: `your product activated`,
      success: true,
      data: {
        products: activeproduct,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `You are not autorized`,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id).populate("winner");

    return res.status(201).send({
      message: `your products`,
      success: true,
      data: {
        product,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `You are not autorized`,
    });
  }
};

const getProductsForVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    const val = req.query.status;

    if (val === "paid") {
      const products = await Products.find({
        vendor: vendorId,
        payment: true,
      });

      return res.status(201).send({
        message: `your products`,
        success: true,
        data: {
          products,
        },
      });
    } else if (val === "delivered") {
      const products = await Products.find({
        vendor: vendorId,
        delivered: true,
      });

      return res.status(201).send({
        message: `your products`,
        success: true,
        data: {
          products,
        },
      });
    } else {
      const products = await Products.find({
        vendor: vendorId,
        status: val,
      });

      return res.status(201).send({
        message: `your products`,
        success: true,
        data: {
          products,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getPaidProductsForVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const val = req.query.delivered;
    const products = await Products.find({
      vendor: vendorId,
      payment: true,
      delivered: val,
    });

    return res.status(201).send({
      message: `your products`,
      success: true,
      data: {
        products,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const selectWinner = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Products.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.status !== "active") {
      return res.status(400).json({ message: "Product is not active" });
    }

    const highestBid = await Bid.findOne({ product: product._id }).sort({
      amount: -1,
    });
    if (highestBid) {
      product.winner = highestBid.user;
      product.winningBidAmount = highestBid.amount;
      product.winningBid = highestBid._id;
      product.status = "ended";
      await product.save();

      res.status(200).json({ message: "Winner selected successfully" });
    } else {
      res.status(404).json({ message: "No bids found for the product" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTotalPaidProductsAndWinningAmount = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const totalPaidProducts = await Products.countDocuments({
      vendor: vendorId,
      payment: true,
    });

    const winningBids = await Products.find({
      vendor: vendorId,
      payment: true,
    });

    const totalWinningAmount = winningBids.reduce(
      (sum, bid) => sum + bid.winningBidAmount,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalPaidProducts,
        totalWinningAmount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getProductById,
  selectWinner,
  pauseProduct,
  getPaidProductsForVendor,
  getProductsForVendor,
  getProductController,
  deleteProduct,
  getProductsForUserBids,
  getMostBidsProducts,
  getProductsController,
  updateProduct,
  activeProduct,
  getProductsByCategory,
  getEndingSoonProducts,
  getNewProducts,
  getTotalPaidProductsAndWinningAmount,
  markDelivered,
  createProduct,
};
