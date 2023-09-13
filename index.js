const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const { connection } = require("./config/db");

// Import environment variables
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create the "uploads" folder if it doesn't exist
const fs = require("fs");
const uploadsFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const Product = mongoose.model("Product", {
  name: String,
  imageUrl: String, // Store the relative path to the image
  description: String,
  price: Number
});

// Define routes
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { name, description, price } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    const product = new Product({ name, description, price, imageUrl });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "aajad@gmail.com" && password === "aajad") {
    res.status(200).json({ message: "Login successful" });
  } else {
    res.status(401).json({ error: "Invalid email or password" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    console.log(products);
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.put("/products/:productId", upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.productId;
    const { name, description, price } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { name, description, price, imageUrl },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/products/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const deletedProduct = await Product.findByIdAndRemove(productId);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(204).json();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, async () => {
  try {
    await connection;
    console.log("Connected to the database");
  } catch (err) {
    console.error(err);
  }
  console.log(`Server is running at port ${port}`);
});
