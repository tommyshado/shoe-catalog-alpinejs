// Elements references
const errorMsg = document.querySelector(".errorMsg");
const paymentMsg = document.querySelector(".payment");

document.addEventListener("alpine:init", () => {
    Alpine.data("catalog", () => {
        return {
            shoes: [],
            cart: [],
            total: 0.0,

            // Add shoe
            createShoe: false,

            // Logged in
            loggedIn: false,

            // payment
            cartPay: 0.0,

            // Headers
            headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage["token"] || localStorage["adminToken"],
            },

            // User
            getUser: {
                usernameOrEmail: "",
                password: "",
            },

            // user login
            login() {
                const loginUrl = "https://api-for-shoes.onrender.com/api/user/login";
                return axios.post(loginUrl, this.getUser);
            },

            // GET the token from the API
            getToken() {
                this.login().then((result) => {
                    // get the error
                    const { error } = result.data;
                    if (error) {
                        errorMsg.innerHTML = error;
                        errorMsg.classList.add("text-[#ff4a1c]");

                        // Set the values in the login input areas to default
                        this.getUser.usernameOrEmail = "";
                        this.getUser.password = "";

                        setTimeout(() => {
                            errorMsg.innerHTML = "";
                        }, 3000);

                        return;
                    }

                    const token = result.data.token;
                    const checkRole = result.data.role === "admin";

                    if (checkRole) {
                        localStorage["adminToken"] = token;
                        // Redirect to the home page
                        if (localStorage["adminToken"]) {
                            window.location.href = "index.html";
                        } else {
                            window.location.href = "login.html";
                        }
                    } else if (!checkRole) {
                        localStorage["token"] = token;
                        window.location.href = "index.html";
                    }
                });
            },

            signupUser: {
                name: "",
                email: "",
                password: ""
            },

            // user signup
            signup() {
                const signupUrl = "https://api-for-shoes.onrender.com/api/user/signup";
                return axios.post(signupUrl, this.signupUser).then((result) => {
                    // get the error
                    const { error } = result.data;
                    if (error) {
                        errorMsg.innerHTML = error;
                        errorMsg.classList.add("text-[#ff4a1c]");

                        // Set the values in the signup input areas to default
                        this.signupUser.name = "";
                        this.signupUser.email = "";
                        this.signupUser.password = "";

                        setTimeout(() => {
                            errorMsg.innerHTML = "";
                        }, 3000);

                        return;
                    }

                    const response = result.data;
                    if (response.status === "success") {
                        window.location.href = "login.html";
                    }
                });
            },

            // Logout
            logout() {
                localStorage["token"] = "";
                localStorage["adminToken"] = "";
                window.location.href = "index.html";
            },

            // Shoes display functionality
            getShoes() {
                const shoesUrl = "https://api-for-shoes.onrender.com/api/shoes";
                return axios.get(shoesUrl);
            },
            showShoes() {
                this.getShoes().then((result) => {
                    const shoes = result.data.data;
                    this.shoes = shoes;
                });
            },

            // Cart functionality
            getCart() {
                const cartUrl = "https://api-for-shoes.onrender.com/api/cart";
                return axios.get(cartUrl, {
                    headers: this.headers,
                });
            },
            addShoe(shoeId) {
                const addUrl = `https://api-for-shoes.onrender.com/api/cart/shoeId/${shoeId}/add`;
                return axios.post(
                    addUrl,
                    {},
                    {
                        headers: this.headers,
                    }
                );
            },
            decrementShoe(shoeId) {
                const decreaseQtyUrl = `https://api-for-shoes.onrender.com/api/cart/shoeId/${shoeId}/remove`;
                return axios.post(
                    decreaseQtyUrl,
                    {},
                    {
                        headers: this.headers,
                    }
                );
            },
            addShoeToCart(shoeId) {
                if (!this.headers["auth-token"]) {
                    errorMsg.innerHTML = "Log in please";
                    errorMsg.classList.add("text-[#ff4a1c]");

                    setTimeout(() => {
                        errorMsg.innerHTML = "";
                    }, 3000);
                }

                this.getShoes().then((result) => {
                    const response = result.data.data;

                    for (const shoes in response) {
                        const qty = response[shoes].shoe_qty;
                        const checkId = response[shoes].shoe_id === shoeId;

                        if (qty > 0 && checkId) {
                            this.addShoe(shoeId).then((result) => {
                                const response = result.data;
                                if (response.status === "success") {
                                    this.showShoes();
                                    this.showCart();
                                }
                            });
                        }
                    }
                });
            },
            decrementShoeQty(shoeId) {
                this.decrementShoe(shoeId).then((result) => {
                    const response = result.data;
                    if (response.status === "success") {
                        this.showShoes();
                        this.showCart();
                    }
                });
            },
            showCart() {
                this.getCart().then((result) => {
                    // Cart data
                    const data = result.data;
                    const cartTotal = data.total;

                    // Set global variables
                    this.cart = data.cart;
                    this.total = cartTotal;
                });
            },

            setMessage() {
                errorMsg.innerHTML = "Product out of stock";
                errorMsg.classList.add("text-[#ff4a1c]");

                setTimeout(() => {
                    errorMsg.innerHTML = "";
                }, 3000);
            },

            // Payment
            proceed: false,
            purchaseHistory: JSON.parse(localStorage.getItem("purchaseHistory")) || [],

            pay() {
                const paymentUrl = "https://api-for-shoes.onrender.com/api/cart/payment";
                return axios.post(
                    paymentUrl,
                    { payment: this.cartPay },
                    {
                        headers: this.headers,
                    }
                );
            },
            paymentForCart() {
                if (this.proceed) {
                    this.pay().then((result) => {
                        // get the error
                        const { error } = result.data;
                        if (error) {
                            paymentMsg.innerHTML = error;
                            paymentMsg.classList.add("text-[#ff4a1c]");

                            setTimeout(() => {
                                paymentMsg.innerHTML = "";
                            }, 3000);

                            return;
                        }

                        const response = result.data;
                        if (response.status === "success") {
                            paymentMsg.innerHTML = "Payment successful.";
                            paymentMsg.classList.add("text-[#1ed760]");

                            // Payment successful, add items to purchase history
                            this.purchaseHistory.push(...response.data);
                            // Clear the cart
                            this.cart = [];
                            // Set the total to zero
                            this.total = 0.0;

                            // Store the updated purchaseHistory in localStorage
                            localStorage.setItem(
                                "purchaseHistory",
                                JSON.stringify(this.purchaseHistory)
                            );

                            setTimeout(() => {
                                paymentMsg.innerHTML = "";
                            }, 3000);
                        }
                    });
                }
            },

            // Remove a shoe in the cart
            removeShoe(shoeId) {
                const removeUrl = `https://api-for-shoes.onrender.com/api/cart/shoeId/${shoeId}/removeAShoe`;
                return axios.post(
                    removeUrl,
                    {},
                    {
                        headers: this.headers,
                    }
                );
            },
            removeShoeFromCart(shoeId) {
                this.removeShoe(shoeId).then((result) => {
                    const response = result.data;
                    if (response.status === "success") {
                        this.showShoes();
                        this.showCart();
                    }
                });
            },

            clear() {
                if (this.proceed) {
                    localStorage["purchaseHistory"] = JSON.stringify([]);
                    location.reload();
                }
            },

            // Make a shoe to display in the catalog
            shoe: {
                shoeName: "",
                description: "",
                ageGroup: "",
                image: "",
                qty: "",
                shoePrice: "",
                shoeColor: "",
                shoeSize: "",
            },
            makeAShoe() {
                const shoes = "https://api-for-shoes.onrender.com/api/shoes";
                return axios.post(shoes, this.shoe);
            },
            showShoe() {
                this.makeAShoe().then((result) => {
                    const response = result.data;
                    if (response.status === "success") {
                        this.showShoes();
                    }
                });
            },

            increaseShoeQty(shoeId) {
                if (this.proceed) {
                    const increaseShoeQtyUrl = `https://api-for-shoes.onrender.com/api/shoes/shoeId/${shoeId}/add`;
                    return axios.post(increaseShoeQtyUrl).then((result) => {
                        const response = result.data;
                        if (response.status === "success") {
                            this.showShoes();
                        }
                    });
                }
            },
            removeShoeInDispay(shoeId) {
                if (this.proceed) {
                    const increaseShoeQtyUrl = `https://api-for-shoes.onrender.com/api/shoes/shoeId/${shoeId}/remove`;
                    return axios.post(increaseShoeQtyUrl).then((result) => {
                        const response = result.data;
                        if (response.status === "success") {
                            this.showShoes();
                        }
                    });
                }
            },

            // Filtering functionality
            dropdownValues: {
                brandname: "",
                color: "",
                size: "",
            },

            filter() {
                const baseUrl = "https://api-for-shoes.onrender.com/api/shoes/brand";

                if (this.dropdownValues.brandname) {
                    let filterUrl = `${baseUrl}/${this.dropdownValues.brandname}`;

                    if (this.dropdownValues.color) {
                        filterUrl += `/color/${this.dropdownValues.color}`;
                    };

                    if (this.dropdownValues.size) {
                        filterUrl += `/size/${this.dropdownValues.size}`;
                    };

                    return axios.get(filterUrl);
                };

                if (this.dropdownValues.color) {
                    const filterUrl = `${baseUrl}/color/${this.dropdownValues.color}`;
                    return axios.get(filterUrl);
                };

                if (this.dropdownValues.size) {
                    const filterUrl = `${baseUrl}/size/${this.dropdownValues.size}`;
                    return axios.get(filterUrl);
                };

            },
            filtered() {
                this.filter().then((result) => {
                    const response = result.data.data;
                    this.shoes = response;

                    if (this.shoes.length === 0) {
                        errorMsg.innerHTML = "Shoe not available";
                        errorMsg.classList.add("text-[#ff4a1c]");

                        setTimeout(() => {
                            errorMsg.innerHTML = "";
                            this.showShoes();
                        }, 3000);
                    }
                });
            },

            init() {
                // SHOW shoes
                this.showShoes();

                // SHOW the cart
                this.showCart();

                if (localStorage["adminToken"]) {
                    this.createShoe = true;
                    this.loggedIn = true;
                } else if (localStorage["token"]) {
                    this.loggedIn = true;
                }
            },
        };
    });
});
