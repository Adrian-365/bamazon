var inquirer = require('inquirer');
var mysql = require("mysql");

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
    console.log("connected as id " + connection.threadId + '\n');
    afterConnection();
});

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

function askForSale() {
    inquirer
        .prompt({
            name: "action",
            type: "list",
            message: "Would you like to purchase any of these items?",
            choices: [
                "Yes, I`m ready to buy!",
                "Not right now, I'm just browsing."
            ]
        })
        .then(function(answer) {
            if (answer.action === "Yes, I`m ready to buy!") {
                console.log('\nGreat!!\n')
                chooseItem();
            } else {
                console.log('\nOkay, we`ll be here!\n')
                connection.end();

            }

        });
};
//-----------------------------------------
var choicesArray = [];

function chooseItem() {
    connection.query("SELECT * FROM products", function(err, res) {
        // console.log(res);
        inquirer.prompt([{
                name: 'choice',
                type: 'checkbox',
                message: 'Which item(s) would you like to buy?',
                //what does the 'value' do?  
                choices: function(value) {
                    for (var i = 0; i < res.length; i++) {
                        choicesArray.push(res[i].product_name);
                    }
                    //what does this return do??
                    return choicesArray;
                }


            },
            {
                name: 'bid',
                type: 'input',
                message: 'How much do you bid?',
                validate: function(value) {
                    if (isNaN(value) == false) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        ]).then(function(answer) {
            // check the bid against the current highestgbid
            connection.query(
                'INSERT into auctions SET ?', {
                    itemname: answer.itemname,
                    category: answer.category,
                    startingbid: answer.startingbid,
                    highestgbid: answer.startingbid
                },
                function(err, res) {
                    console.log("Your bid has been entered, thank you.");
                    start();
                }
            )

        })




    });

}