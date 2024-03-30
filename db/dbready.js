const client = require("./db");

async function isReady() {
  try {
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = $1
      );
    `;

    const createTableQueries = [
      `
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS images (
        image_id SERIAL PRIMARY KEY,
        image VARCHAR(255) NOT NULL
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        description VARCHAR(1000) NOT NULL,
        date DATE NOT NULL 
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        name VARCHAR(300),
        price INT NOT NULL,
        vehicle VARCHAR(300),
        duration VARCHAR(300),
        guiding VARCHAR(300),
        description VARCHAR(1500) NOT NULL,
        image VARCHAR(300) NOT NULL,
        active BOOLEAN DEFAULT true,
        video VARCHAR(500) NOT NULL
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS trips_type (
        id SERIAL PRIMARY KEY,
        trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
        type INT REFERENCES classes(id) ON DELETE CASCADE
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS contactus (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mail VARCHAR(255) NOT NULL,
        description VARCHAR(600) NOT NULL
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mail VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(255) NOT NULL DEFAULT 'user',
        pass VARCHAR(255) NOT NULL,
        verify_code VARCHAR(255)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES accounts(id) NOT NULL,
        name VARCHAR(255) NOT NULL,
        trip_id INT REFERENCES trips(id) NOT NULL,
        number_of_person INT NOT NULL,
        arrivaldate DATE NOT NULL,
        departuredate DATE NOT NULL,
        flight_number VARCHAR(255) NOT NULL,
        hotel_name VARCHAR(255) NOT NULL,
        room_num VARCHAR(255) NOT NULL,
        paid BOOLEAN DEFAULT FALSE,
        o_id VARCHAR(255)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES accounts(id) NOT NULL,
        comment VARCHAR(255),
        video VARCHAR(500)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS accountactive (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES accounts(id) NOT NULL
      );
      `
    ];

    const tablesToCheck = [
      "classes",
      "images",
      "blogs",
      "trips",
      "trips_type",
      "contactus",
      "accounts",
      "orders",
      "feedbacks",
      "accountactive"
    ];

    for (let i = 0; i < tablesToCheck.length; i++) {
      const res = await client.query(tableCheckQuery, [tablesToCheck[i]]);
      const existingTable = res.rows[0].exists;

      if (!existingTable) {
        await client.query(createTableQueries[i]); // Use the index i to access the corresponding query
        console.log(`Table ${tablesToCheck[i]} created successfully!`);
      }
    }

    console.log("All tables checked!");
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

module.exports = isReady;
