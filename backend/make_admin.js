const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const email = "bigofi4492@prodbits.com";
  try {
    // Check if user exists
    const userRes = await pool.query("SELECT user_id, email FROM profiles WHERE email = $1", [email.toLowerCase()]);
    let userId;
    let actualEmail = email;

    if (userRes.rows.length === 0) {
      // List all users
      const allUsers = await pool.query("SELECT user_id, email FROM profiles");
      if (allUsers.rows.length === 0) {
        console.log("No registered users found in database. Please sign up on the site first.");
        process.exit(1);
      }
      userId = allUsers.rows[0].user_id;
      actualEmail = allUsers.rows[0].email;
      console.log(`Email ${email} not found. Defaulting to first registered user: ${actualEmail}`);
    } else {
      userId = userRes.rows[0].user_id;
    }

    // Insert user_role
    await pool.query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT DO NOTHING",
      [userId]
    );

    console.log(`SUCCESS: User ${actualEmail} is now assigned the 'admin' role!`);
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await pool.end();
  }
}

run();
