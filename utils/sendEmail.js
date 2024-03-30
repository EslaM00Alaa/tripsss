
const nodemailer = require("nodemailer");

    let sendMail  = async (mail, msg, sup) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "ea37645520@gmail.com",
            pass: "zuafhkesfceautux",
          },
    });

    const mailOptions = {
        from: "ea37645520@gmail.com",
        to: mail, // Make sure `mail` contains a valid email address
        subject: `${sup}`,
        html: `<h1>${msg}</h1>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Failed to send email:", error);
            throw error; // Throw the error to indicate failure
        } else {
            console.log("Email sent successfully");
        }
    });
};

module.exports = sendMail ;
