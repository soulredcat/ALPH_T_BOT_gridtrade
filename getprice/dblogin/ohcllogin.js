import mysql from 'mysql';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
};

const ohcldb = mysql.createConnection(dbConfig);

const ensureOHCLDatabase = () => {
    return new Promise((resolve, reject) => {
        ohcldb.query(`CREATE DATABASE IF NOT EXISTS ohcldata`, (err) => {
            if (err) {
                console.error('Error creating or using database:', err);
                return reject(err);
            }
            console.log('Database "ohcldata" created or already exists.');
            ohcldb.query(`USE ohcldata`, (err) => {
                if (err) {
                    console.error('Error using database:', err);
                    return reject(err);
                }
                resolve();
            });
        });
    });
};

const connectToohcl = async () => {
    return new Promise((resolve, reject) => {
        ohcldb.connect(async (err) => {
            if (err) return reject(err);
            await ensureOHCLDatabase(); // Ensure the database is created and selected
            resolve();
        });
    });
};

const closeohcl = async () => {
    return new Promise((resolve, reject) => {
        ohcldb.end((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

export { connectToohcl, closeohcl, ohcldb };
