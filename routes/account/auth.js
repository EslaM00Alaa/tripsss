const client = require("../../db/db");
const isAdmin = require("../../middleware/isAdmin");
const isUser = require("../../middleware/isUser");
const {
  validateUser,
  validateLogin,
  validateEmail,
  validateResetpass,
} = require("../../models/user");
const express = require("express");
const generateToken = require("../../utils/account");
const router = express.Router();
const bcrypt = require("bcryptjs");
const sendMail = require("../../utils/sendEmail");

router.post("/registerAdmin", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  req.body.pass = await bcrypt.hash(req.body.pass, salt);

  const { name, mail, pass } = req.body;
  try {
    const query = `
        INSERT INTO accounts (name, mail, role, pass) 
        VALUES ($1, $2, 'admin', $3)
        RETURNING *;
      `;
    const values = [name, mail, pass];
    const result = await client.query(query, values);
 console.log(result.rows[0].id);
    let token = generateToken(result.rows[0].id, mail, "admin");
    res.json({ success: true, token, role: result.rows[0].role });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(404).json({ msg: error.details[0].message });

    const salt = await bcrypt.genSalt(10);
    req.body.pass = await bcrypt.hash(req.body.pass, salt);

    let { name, mail, pass } = req.body;

    let result = await client.query("SELECT register($1, $2, $3);", [
      name,
      mail,
      pass,
    ]);
    let id = result.rows[0].register; // Accessing the returned value using the correct alias
    console.log(id);
    let token = generateToken(id, mail, "user");
    res.json({ token, role: "user" });
  } catch (error) {
    return res.status(404).json({ msg: error.message });
  }
});



async function sendCode(mail, user_id) {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  const salt = await bcrypt.genSalt(10);
  const hashedNumber = await bcrypt.hash(randomNumber.toString(), salt);

  const sqlQuery1 = "UPDATE accounts SET verify_code = $1 WHERE id = $2";
  await client.query(sqlQuery1, [hashedNumber.toString().trim(), user_id]);
  await sendMail(mail, randomNumber, "verifycode");
}


router.get("/sendagain", isUser, async (req, res) => {
  try {
    let mail = req.body.mail ;
    let id = req.body.user_id ;
   console.log(mail,id);
    await sendCode(mail, id);
    res.json({ msg: "Code sent again successfully" });
  } catch (error) {
    console.error("Send code error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    const { mail, pass } = req.body;

    const result = await client.query("SELECT * FROM get_user($1);", [mail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "No user found for this account" });
    }

    const { id, pass: hashedPassword, role } = result.rows[0];

    const isPasswordMatch = await bcrypt.compare(pass, hashedPassword);

    if (isPasswordMatch) {
      let active = false;

      if (role === "user") {
        const result2 = await client.query("SELECT * FROM account_active WHERE user_id = $1 ;", [id]);

        if (result2.rows.length > 0) {
          active = true;
        } else {
          // If user is not active, send activation code and update account_active table
          await sendCode(mail, id);
          await client.query("INSERT INTO account_active (user_id) VALUES ($1);", [id]);
        }
      } else {
        active = true;
      }

      const token = generateToken(id, mail, role);
      res.json({ token, role, active });
    } else {
      res.status(401).json({ msg: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});




router.post("/verifycode", async (req, res) => {
  try {
    const { error } = validateEmail(req.body);
    if (error) {
      return res.status(400).json({ msg: error.details[0].message });
    }

    const sqlQuery = "SELECT * FROM accounts WHERE mail = $1";
    const result = await client.query(sqlQuery, [req.body.mail]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      await sendCode(user.mail,user.id);
      res.json("email send successfully !");
    } else {
      return res.status(404).json({ msg: "No account for this user" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Internal server error" });
  }
});

router.post("/resetpass", async (req, res) => {
  const { error } = validateResetpass({
    code: req.body.code,
    mail: req.body.mail,
    pass: req.body.pass,
  });

  // Check if there's a validation error
  if (error) {
    return res.status(400).json({ msg: error.details[0].message }); // Change status to 400 for validation errors
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.pass, salt);

    const verifyCode = req.body.code.trim(); // Trim the verify code
    const mail = req.body.mail.trim(); // Trim the email
    const sqlQuery = "SELECT * FROM accounts WHERE mail = $1";
    const result = await client.query(sqlQuery, [mail]);

    const user = result.rows[0];

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(verifyCode, user.verify_code.trim());

    // Check if the verification code matches
    if (isPasswordMatch) {
      const sqlQuery1 = "UPDATE accounts SET pass = $1 WHERE id = $2";
      await client.query(sqlQuery1, [hashedPassword, user.id]);

      return res.json({ msg: "Password changed successfully" });
    } else {
      return res.status(401).json({ msg: "Verification code is incorrect" }); // Use 401 for authentication errors
    }
  } catch (err) {
    console.error("Error in resetpass route:", err);
    return res.status(500).json({ msg: "Internal server error" }); // Handle internal server errors
  }
});



router.post("/active", isUser, async (req, res) => {
  try {
    const { user_id, code } = req.body;
    const vcodeResult = await client.query("SELECT verify_code FROM accounts WHERE id = $1", [user_id]);
    const vcode = vcodeResult.rows[0]?.verify_code;
    
    if (!vcode) {
      return res.status(404).json({ msg: "User not found or verification code not set" });
    }

    const isPasswordMatch = await bcrypt.compare(code, vcode);

    if (isPasswordMatch) {
      await client.query("INSERT INTO account_active (user_id) VALUES ($1)", [user_id]);
      return res.json({ msg: "Account activated successfully" });
    } else {
      return res.status(400).json({ msg: "Verification code is incorrect" });
    }
  } catch (error) {
    console.error("Error in /active endpoint:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
});







module.exports = router;
