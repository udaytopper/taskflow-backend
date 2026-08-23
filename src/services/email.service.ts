import nodemailer from "nodemailer";

export async function sendAssignmentEmail(to:string,taskTitle:string){
 if(!process.env.SMTP_HOST){console.log(`[email:development] To=${to} Task=${taskTitle}`);return;}
 const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT??587),secure:process.env.SMTP_SECURE==="true",auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined});
 await transporter.sendMail({from:process.env.EMAIL_FROM??"taskflow@example.com",to,subject:`Task assigned: ${taskTitle}`,text:`You have been assigned the task: ${taskTitle}`});
}
