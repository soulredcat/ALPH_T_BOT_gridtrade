import mysql from 'mysql'; // Gunakan import untuk modul mysql

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tokenlist'
});

let isConnected = false;

const connectToDatabase = () => {
    if (isConnected) {
        console.log('Already connected to the database.');
        return;
    }

    db.connect((err) => {
        if (err) {
            console.error('Error connecting to the database: ', err);
            return;
        }
        isConnected = true;
        console.log('Connected to the database.');
        createTables();
    });
};

const createTables = () => {
    const createTokenPriceTable = `
        CREATE TABLE IF NOT EXISTS tokenprice (
            id INT AUTO_INCREMENT PRIMARY KEY,
            flip VARCHAR(10) DEFAULT '1',
            symbol VARCHAR(255),
            address VARCHAR(255),
            balance DECIMAL(64, 18) DEFAULT 0,
            amount DECIMAL(64, 18) DEFAULT 0,
            price0 DECIMAL(64, 18) DEFAULT 0,
            price1 DECIMAL(64, 18) DEFAULT 0,
            color VARCHAR(10) NOT NULL DEFAULT 'green',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_symbol_address (symbol, address)
        )
    `;

    db.query(createTokenPriceTable, (error, results) => {
        if (error) {
            console.error('Error creating token price table: ', error);
            return;
        }
        console.log('Token price table checked/created successfully.');
    });
};

const getPrice0BySymbol = (symbol) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT price0 FROM tokenprice WHERE symbol = ?`;
        
        db.query(query, [symbol], (err, results) => {
            if (err) {
                console.error('Error fetching price0: ', err);
                return reject(err);
            }

            if (results.length > 0) {
                const price0 = results[0].price0;
                resolve(price0);
            } else {
                console.log(`No price0 found for symbol: ${symbol}`);
                resolve(0);
            }
        });
    });
};

const closeConnection = () => {
    if (!isConnected) {
        console.log('Database connection is already closed.');
        return;
    }

    db.end((err) => {
        if (err) {
            console.error('Error closing the database connection: ', err);
        } else {
            isConnected = false;
            console.log('Database connection closed.');
        }
    });
};

export { db, connectToDatabase, closeConnection, getPrice0BySymbol };
