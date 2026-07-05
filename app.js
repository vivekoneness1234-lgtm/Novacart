const express = require("express");
const fs = require("fs");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));

// CART
let cart = [];

// READ PRODUCTS
function getProducts() {
  return JSON.parse(fs.readFileSync("products.json"));
}

// SAVE PRODUCTS
function saveProducts(data) {
  fs.writeFileSync("products.json", JSON.stringify(data, null, 2));
}

// LOGIN CHECK
function isLoggedIn(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login");
}

// HOME PAGE
app.get("/", (req, res) => {

  const products = getProducts();

  let html = `
  <link rel="stylesheet" href="/style.css">

  <div class="topbar">
    <h1>My Store</h1>
    <a href="/cart">🛒 View Cart (${cart.length})</a>
  </div>

  <div class="products">
  `;

  products.forEach(p => {

    html += `
    <a href="/product/${p.id}" class="product-link">

      <div class="card">

        <img src="${p.images[0]}" class="product-image">

        <h3>${p.name}</h3>

        <p>${p.desc}</p>

        <div class="price-row">
          <b>₹${p.price}</b>
          <small><s>₹${p.oldprice}</s></small>
        </div>

        <small>Delivery: ${p.delivery}</small>

      </div>

    </a>
    `;
  });

  html += `</div>`;

  res.send(html);
});

// PRODUCT PAGE
app.get("/product/:id", (req, res) => {

  const products = getProducts();

  const product = products.find(p => p.id == req.params.id);

  if (!product) return res.send("Product not found");

  let images = "";

  product.images.forEach(img => {
    images += `
      <img src="${img}" class="gallery-image">
    `;
  });

  let comments = "";

  if (product.comments) {

    product.comments.forEach(c => {

      comments += `
      <div class="review-card">

        <b>${c.user}</b>

        <p>${c.text}</p>

      </div>
      `;
    });
  }

  res.send(`
  <link rel="stylesheet" href="/style.css">

  <div class="product-page">

    <div class="card">

      <h1>${product.name}</h1>

      <div class="gallery">
        ${images}
      </div>

      <video class="product-video" controls>
        <source src="${product.video}" type="video/mp4">
      </video>

      <p>${product.desc}</p>

      <p><b>Details:</b> ${product.details}</p>

      <div class="price-row">
        <h2>₹${product.price}</h2>
        <small><s>₹${product.oldprice}</s></small>
      </div>

      <b class="stock">${product.stock}</b>

      <br><br>

      <small>Delivery: ${product.delivery}</small>

      <br><br>

      <form action="/buy" method="POST">

        <input type="hidden" name="product" value="${product.name}">

        <input type="text" name="name" placeholder="Your Name" required>

        <br><br>

        <input type="text" name="phone" placeholder="Phone Number" required>

        <br><br>

        <textarea name="address" placeholder="Address" required></textarea>

        <br><br>

        <button type="submit">Place Order</button>

      </form>

      <br>

      <a href="/add-to-cart/${product.id}">
        <button>Add To Cart 🛒</button>
      </a>

    </div>

    <h1>User Reviews ⭐</h1>

    ${comments}

    <div class="card">

      <form action="/comment/${product.id}" method="POST">

        <input type="text" name="user" placeholder="Your Name" required>

        <br><br>

        <textarea name="text" placeholder="Write Review" required></textarea>

        <br><br>

        <button type="submit">Post Review</button>

      </form>

    </div>

  </div>
  `);
});

// COMMENT SYSTEM
app.post("/comment/:id", (req, res) => {

  let products = getProducts();

  let product = products.find(p => p.id == req.params.id);

  if (!product.comments) {
    product.comments = [];
  }

  product.comments.push({
    user: req.body.user,
    text: req.body.text
  });

  saveProducts(products);

  res.redirect("/product/" + req.params.id);
});

// PLACE ORDER
app.post("/buy", (req, res) => {

  let orders = [];

  if (fs.existsSync("orders.json")) {
    orders = JSON.parse(fs.readFileSync("orders.json"));
  }

  orders.push({
    product: req.body.product,
    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address
  });

  orders.push({
    id: Date.now(),
    product: req.body.product,
    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
    status: "Pending"
  });

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.send(`
  <link rel="stylesheet" href="/style.css">

  <div class="success-box">

    <h1>Order Placed Successfully 😄</h1>

    <p>You can cancel your order within 24 hours by contacting support.</p>

    <a href="/">Back To Home</a>

  </div>
  `);
});

// ADD TO CART
app.get("/add-to-cart/:id", (req, res) => {

  const products = getProducts();

  const product = products.find(p => p.id == req.params.id);

  if (product) {
    cart.push(product);
  }

  res.send(`
  <link rel="stylesheet" href="/style.css">

  <div class="success-box">

    <h1>Added To Cart 🛒</h1>

    <a href="/cart">Go To Cart</a>

    <br><br>

    <a href="/">Continue Shopping</a>

  </div>
  `);
});

// CART PAGE
app.get("/cart", (req, res) => {

  let html = `
  <link rel="stylesheet" href="/style.css">

  <h1>Your Cart 🛒</h1>
  `;

  if (cart.length === 0) {
    html += `<p>Cart is empty</p>`;
  }

  cart.forEach((p, index) => {

    html += `
    <div class="card">

      <img src="${p.images[0]}" class="product-image">

      <h3>${p.name}</h3>

      <p>${p.desc}</p>

      <b>₹${p.price}</b>

      <br><br>

      <a href="/remove-cart/${index}">Remove</a>

    </div>
    `;
  });

  html += `
  <br><br>

  <a href="/">Continue Shopping</a>
  `;

  res.send(html);
});

// REMOVE CART ITEM
app.get("/remove-cart/:index", (req, res) => {

  cart.splice(req.params.index, 1);

  res.redirect("/cart");
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/views/login.html");
});

// LOGIN
app.post("/login", (req, res) => {

  if (req.body.username === "admin" && req.body.password === "1234") {

    req.session.user = "admin";

    res.redirect("/admin");

  } else {

    res.send("Wrong login");

  }
});

// ADMIN PAGE
app.get("/admin", isLoggedIn, (req, res) => {

  const products = getProducts();

  let html = fs.readFileSync("./views/admin.html", "utf-8");

  let list = "";

  products.forEach(p => {

    list += `
      ${p.name} - ₹${p.price}
      <a href="/delete/${p.id}">Delete</a><br><br>
    `;
  });

  html = html.replace("{{products}}", list);

  res.send(html);
});

// ADD PRODUCT
app.post("/add", isLoggedIn, (req, res) => {

  let products = getProducts();

  products.push({
    id: Date.now(),
    name: req.body.name,
    price: req.body.price,
    oldprice: req.body.oldprice,
    desc: req.body.desc,
    details: req.body.details,
    stock: req.body.stock,
    delivery: req.body.delivery,
    images: [
      req.body.image1,
      req.body.image2,
      req.body.image3
    ],
    video: req.body.video,
    comments: []
  });

  saveProducts(products);

  res.redirect("/admin");
});

// DELETE PRODUCT
app.get("/delete/:id", isLoggedIn, (req, res) => {

  let products = getProducts();

  products = products.filter(p => p.id != req.params.id);

  saveProducts(products);

  res.redirect("/admin");
});

// VIEW ORDERS (ADMIN ONLY)
app.get("/orders", isLoggedIn, (req, res) => {

  let orders = [];

  if (fs.existsSync("orders.json")) {
    orders = JSON.parse(fs.readFileSync("orders.json"));
  }

  let html = `
  <link rel="stylesheet" href="/style.css">
  <h1>All Orders</h1>
  `;

  if (orders.length === 0) {
    html += "<p>No orders yet.</p>";
  }
  orders.forEach(o => {

    html += `
    <div class="card">
  
      <h3>${o.product}</h3>
  
      <p><b>Customer:</b> ${o.name}</p>
  
      <p><b>Phone:</b> ${o.phone}</p>
  
      <p><b>Address:</b> ${o.address}</p>
  
      <p><b>Status:</b> ${o.status}</p>
  
      <a href="/accept-order/${o.id}">Accept</a>
      |
      <a href="/ship-order/${o.id}">Ship</a>
      |
      <a href="/deliver-order/${o.id}">Deliver</a>
      |
      <a href="/delete-order/${o.id}">Delete</a>
  
    </div>
    `;
  });
  res.send(html);

});


app.get("/accept-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  let order = orders.find(o => o.id == req.params.id);

  if (order) {
    order.status = "Accepted";
  }

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});


app.get("/ship-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  let order = orders.find(o => o.id == req.params.id);

  if (order) {
    order.status = "Shipped";
  }

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});


app.get("/deliver-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  let order = orders.find(o => o.id == req.params.id);

  if (order) {
    order.status = "Delivered";
  }

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});


app.get("/delete-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  orders = orders.filter(o => o.id != req.params.id);

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});

// LOGOUT
app.get("/accept-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  let order = orders.find(o => o.id == req.params.id);

  if (order) {
    order.status = "Accepted";
  }

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});

app.get("/ship-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  let order = orders.find(o => o.id == req.params.id);

  if (order) {
    order.status = "Shipped";
  }

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});

app.get("/deliver-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  let order = orders.find(o => o.id == req.params.id);

  if (order) {
    order.status = "Delivered";
  }

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});

app.get("/delete-order/:id", isLoggedIn, (req, res) => {

  let orders = JSON.parse(fs.readFileSync("orders.json"));

  orders = orders.filter(o => o.id != req.params.id);

  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

  res.redirect("/orders");
});

// LOGOUT
app.get("/logout", (req, res) => {

  req.session.destroy();

  res.redirect("/");
});
