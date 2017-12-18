var inquirer = require('inquirer');
var mysql = require("mysql");
//------------------------
var connection = mysql.createConnection({
    host: "localhost",
    port: 3307,
    // Your username
    user: "root",
    // Your password
    password: "root",
    database: "bamazon"
});
connection.connect(function(err) {
    if (err) throw err;
    // console.log("connected as id " + connection.threadId + '\n');
    afterConnection();
});
//-------------------------
function afterConnection() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        console.log('***ITEMS CURENTLY FOR SALE****\n')
        for (var i = 0; i < res.length; i++) {
            if (res[i].stock_quantity > 0) {
                console.log("ID: " + res[i].product_id + " || " + res[i].product_name + " || Price: $" + res[i].price);
            } else {
                console.log("ID: " + res[i].product_id + " || " + res[i].product_name + " || Price: $" + res[i].price + '(OUT OF STOCK, CHECK BACK SOON)');
            }
        }
        console.log('\n');

        askForSale();
    });
};
//-----------------------------------------
function askForSale() {
    inquirer
        .prompt({
            name: "action",
            type: "list",
            message: "Would you like to purchase any of these items?",
            choices: [
                "Yes, I\'m ready to buy!",
                "Not right now, I\'m just browsing."
            ]
        })
        .then(function(answer) {
            if (answer.action === "Yes, I\'m ready to buy!") {
                console.log('\nGreat!!\n')
                chooseItem();
            } else {
                console.log('\nOkay, we\'ll be here when you are ready!\n')
                connection.end();

            }

        });
};
//-----------------------------------------

var numPurchased;

function chooseItem() {
    connection.query("SELECT * FROM products", function(err, res) {
        // console.log(res);
        inquirer.prompt([{
                name: 'choice',
                type: 'list',
                paginated: true,
                message: 'Which item would you like to buy?',
                //what does the 'value' do?  
                choices: function(value) {
                    var choicesArray = [];
                    for (var i = 0; i < res.length; i++) {
                        choicesArray.push(res[i].product_name);
                    }
                    //what does this return do??
                    return choicesArray;
                }
            },
            {
                name: 'units',
                type: 'input',
                message: 'How many of these would you like today?',
                validate: function(value) {
                    if (isNaN(value) == false) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        ]).then(function(answer) {
            numPurchased = '';
            numPurchased = parseInt(answer.units);
            // check the bid against the current highestgbid
            connection.query("SELECT * FROM products WHERE product_name ='" + answer.choice + "'", function(err, res) {
                if (answer.units > res[0].stock_quantity) {
                    function ammendOrder() {
                        inquirer
                            .prompt({
                                name: "ammend",
                                type: "list",
                                message: 'My apologies, we only have ' + res[0].stock_quantity + ' of those in stock right now. Would you like to ammend your order, or maybe buy something else instead?',
                                choices: [
                                    "Yes let\'s ammend the order, or buy something different.",
                                    "No, thank you."
                                ]
                            })
                            .then(function(answer) {
                                if (answer.ammend === "Yes let\'s ammend the order, or buy something different.") {
                                    console.log('\n');
                                    chooseItem();
                                } else {
                                    console.log('\nOkay, we\'ll be here when you are ready!\n')
                                    connection.end();

                                }

                            });
                    }

                    ammendOrder();
                } else {
                    var total = answer.units * res[0].price;
                    console.log('Thank you that will be $' + total + ', please.');
                    inquirer
                        .prompt({
                            name: "pay",
                            type: "list",
                            message: 'Complete Transaction?',
                            choices: [
                                "Yes.",
                                "Nope."
                            ]
                        })
                        .then(function(answer) {

                            function continue2() {
                                inquirer
                                    .prompt({
                                        name: "continue",
                                        type: "list",
                                        message: 'Would you like to continue shopping?',
                                        choices: [
                                            "Yes, please.",
                                            "No, thank you."
                                        ]
                                    })
                                    .then(function(answer) {
                                        if (answer.continue === "Yes, please.") {
                                            console.log('\n');
                                            chooseItem();
                                        } else {
                                            console.log('\nOkay, we\'ll be here when you are ready!\n')
                                            connection.end();

                                        }

                                    });

                            }

                            if (answer.pay === "Yes.") {

                                var currentStock = parseInt(res[0].stock_quantity);

                                var newStock = currentStock - numPurchased;

                                connection.query("UPDATE products SET stock_quantity = " + newStock + " WHERE product_name = '" + res[0].product_name + "'", function(err, res) {

                                    console.log('Thank you! Your account has been debited $' + total + '.\n\nOne of our all-seeing drones will deliver your purchase shortly.  \nDon\'t worry; we know exactly where you are at all times. We\'re Bamazon - we know everything.\n');
                                    continue2();
                                })
                            } else {
                                continue2();
                            }
                        });
                }
            })
        })
    });
}