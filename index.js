const isReady = require("./db/dbready");
const procedureReady = require("./db/isProcedureReady");
//const sanitizeInput = require("./middlewares/sanitizeinput");

require("dotenv").config();
const express = require("express"),
  bodyParser = require("body-parser"),
  cors = require("cors"),
  app = express(),
  port = process.env.PORT,
  fs=require('fs'),
  path = require("path"),
  helmet = require("helmet"),
  client = require("./db/db");

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});


app.use(express.urlencoded({ extended: true }))
 .use(express.json())
 .use(
  helmet.contentSecurityPolicy({
     useDefaults: true,
     imgSrc: ["'self'", "https: data:"],
     mediaSrc: ["*", "'self", "https:", "data:"],
}))
 .use(cors())
.use('/videos', express.static(path.join(__dirname, 'videos')));



app.use("/api/classes",require("./routes/classes/classes"));
app.use("/api/types",require("./routes/typesforClass/types"));
app.use("/api/blogs",require("./routes/blogs/blog"));
app.use("/api/trips",require("./routes/trips/trip"));
app.use("/api/contactus",require("./routes/contactus/contactUs"));
app.use("/api/account",require("./routes/account/auth"));
app.use("/api/orders",require("./routes/order/order"));
app.use("/api/feedback",require("./routes/feedbacks/feedbacks"));


// app.get('/api/videos/:filename', (req, res) => {
//   const fileName = req.params.filename;
//   console.log(fileName);
//   const filePath = path.join(__dirname, 'videos', fileName); // Adjusted filePath
//  console.log(filePath);
//   if (!fs.existsSync(filePath)) { // Check if file exists
//     return res.status(404).send('File not found');
//   }

//   const stat = fs.statSync(filePath);
//   const fileSize = stat.size;
//   const range = req.headers.range;

//   if (range) {
//     const parts = range.replace(/bytes=/, '').split('-');
//     const start = parseInt(parts[0], 10);
//     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

//     const chunksize = end - start + 1;
//     const file = fs.createReadStream(filePath, { start, end });
//     const head = {
//       'Content-Range': `bytes ${start}-${end}/${fileSize}`,
//       'Accept-Ranges': 'bytes',
//       'Content-Length': chunksize,
//       'Content-Type': 'video/mp4'
//     };
//     res.writeHead(206, head);
//     file.pipe(res);
//   } else {
//     const head = {
//       'Content-Length': fileSize,
//       'Content-Type': 'video/mp4'
//     };
//     res.writeHead(200, head);
//     fs.createReadStream(filePath).pipe(res);
//   }
// });


app.get('/dealltable', async (req, res) => {
  try {
   
    let query = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' FROM pg_tables WHERE schemaname = 'public';`;
    let result = await client.query(query);
    for (const row of result.rows) {
      const dropTableQuery = row['?column?'];
      await client.query(dropTableQuery);
    }

    // Drop all functions
    query = `SELECT 'DROP FUNCTION IF EXISTS "' || routine_name || '" CASCADE;' FROM information_schema.routines WHERE specific_schema = 'public' AND routine_type = 'FUNCTION';`;
    result = await client.query(query);
    for (const row of result.rows) {
      const dropFunctionQuery = row['?column?'];
      await client.query(dropFunctionQuery);
    }

    // Drop all procedures
    query = `SELECT 'DROP PROCEDURE IF EXISTS "' || proname || '" CASCADE;' FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');`;
    result = await client.query(query);
    for (const row of result.rows) {
      const dropProcedureQuery = row['?column?'];
      await client.query(dropProcedureQuery);
    }

    await client.end();
    res.json({ msg: "All tables, functions, and procedures deleted." });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});   


























client
  .connect()
  .then(async() => {
    console.log("psql is connected ..");
    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
    await isReady();
    await procedureReady();
  })
  .catch((error) => console.log(error));
