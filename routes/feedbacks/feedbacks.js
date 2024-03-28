
const express = require('express');
const path = require('path');
const fs = require("fs")
const client = require("../../db/db");
const validatefeedbacks = require('../../models/feedback.js');
const isUser = require('../../middleware/isUser.js'); 
const isAdmin = require('../../middleware/isAdmin.js');
const {videoUpload} = require('../../utils/uploadvideo.js');

const router = express.Router();



router.post("/",  videoUpload.single("video"), isUser, async (req, res) => {
    try {
  
      
      let comment = req.body.comment;
      let user_id = req.body.user_id;
      console.log(req.body);

       console.log(user_id);
      let videoPath = null;
      if (req.file) {
        videoPath = `https://api.hurghadaskyhightrips.com/videos/${req.file.filename}`;
      }
  
      if (videoPath) {
        await client.query("CALL insert_feedback($1,$2,$3);", [user_id, comment, videoPath]);
      } 
      else if(!comment && !videoPath )
       {
        return res.status(404).json({msg:"must send any thing"})
       }
      else {
        await client.query("CALL insert_feedback2($1,$2);", [user_id, comment]);
      }
  
      res.json({ msg: "Feedback submitted successfully" });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  });
  
  

router.get('/', async (req, res) => {
    try {
        const result = await client.query("SELECT  COUNT(*) AS cnt FROM feedbacks ");
        let cnt = result.rows[0].cnt ;

        const count = Math.ceil (cnt/5);
        
        res.json({ count: count });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
});




router.get('/:pgn',async(req,res)=>{
    try {
        let pageNumber = req.pgn ;
        let result = await client.query("SELECT * FROM get_feedbacks_pagination($1);",[pageNumber]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
})


router.get('/user/:pgn',isUser,async(req,res)=>{
    try {
        let id = req.body.user_id;
        let pageNumber = req.params.pgn ;
        let result = await client.query("SELECT * FROM get_feedbackss($1,$2);",[pageNumber,id]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
})




router.delete('/:id',async(req,res)=>{
    try {
        let feedback_id = req.params.id ;
        await client.query("CALL delete_feedbacks($1);",[feedback_id]);
        res.json({msg:"one Feedback deleted "});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
})



















module.exports=router;