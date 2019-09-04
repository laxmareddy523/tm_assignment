# Task-Assignment Module
A Web app that manages your day to day task and csv uploads, Express.js, Mongoose, MongoDB, mLab, Node-Mailer, Gmail-API, Passport.js, Express-Handlebars, Bootstrap, jQuery, fast-csv, HTML5 & CSS.

# Screeshots shared in application folder you can check the outputs of the application

# Node JS with Mongo DB
A simple and Structured Task Assignment Application using Node JS and Mongo DB. 

•	To perform basic operation all Create, Fetch, Delete and Update Rest API functionality.

•	Used Express framework to obtain required operations.

•	Used Express router to route endpoint path.

•	Used JWT Token for security and authentication of API.

•	MVC structure in which Route, Service and Model layer.

•	Used AJV as schema validator which validate request and response schema.

•	Used Connection Pooling which led to reduce number of connection at any point of time and reduce stress in DB which leads to better availability and Performance of DB.

•	Used common error structure format for all type of error throwing in Application.

•	Pm2 process managers which help to watch, reload, restart and monitor with load balancer in each and every activity.

•	Pm2 used to check thread process like run, wait, start and stop.

•	Pm2 used identify how many servers run on the system.

•	nodemailer is used to send mail over SMTP. As for i now used for sending mail if error comes.

•	bcrypt is used to encrypt your password through salt and hashing technique and which won't store password as plain text in database.

•	Artillery is used to perform load testing which will check sustainability of your API at high traffic.

•	Logger used to generate logs and console data.

•	Express – session management and express – validation used to session and validate the data.

•	Client and Server application will be developed with task management system

# Used Packages

1. MONGODB
npm install mongodb --save 

•	Used to get mysql function and modules to perform DB operations.
________________________________________
2. Express
npm install express 

•	Platform it built over it Rest API framework and functions.
________________________________________
3. Ajv
npm install ajv 

•	ajv used for validation of schema.
________________________________________
4. JWT
npm install jsonwebtoken 

•	jsonwebtoken is used for authentication of api through Token.
________________________________________
5. Nodemon
npm install nodemon 

•	Nodemon will watch the files in the directory and if file changes automatically restart application. 
________________________________________
6. pm2
npm install pm2  

•	pm2 will watch, restart and reload application if any crashes happen, it provide cluster mode as well as zero downtime failure. 
________________________________________
7. nodemailer
npm install nodemailer  

•	nodemailer will send mail to given mail Id as for now i used for sending if any error comes.
________________________________________
8. artillery
npm install artillery  

•	Artillery will perform load testing and gives logs, how sustainable your Api to perform number of request in per second. 
________________________________________
9. bcrypt
npm install bcrypt  

•	bcrypt will encrypt your password throughing hashing so your password won't store as plain text.
________________________________________
10. fast-csv
npm install fast-csv  

•	Fast – csv is used to read the csv files.
________________________________________
# Table Creation in Mongo DB

1.	Models will be deployed through node js application no needs to create collections we need to create only data base name. 

2.	You can try creating your table as well just need to change query and table name in model section.

Get Started
	1.	$ git clone or bit bucket to clone the project
	2.	$ npm install
	3.	Launch Enviornment: $ node sererv.js or nodemon server.js
	4.	In Cluster mode with the help of pm2 [optional step]:$ pm2 start server.js or pm2 start server.js -i <no of instances>
	5.	Open in browser: open http://localhost:3000
________________________________________



