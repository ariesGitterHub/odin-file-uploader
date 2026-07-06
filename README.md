REMINDER TO SELF 
npx prisma migrate dev --name init: This is the command you use whenever you first initialize the schema prisma file, or change your schema prisma file.

npx prisma migrate reset: The command is specifically designed to reset your database and reapply all migrations (and seed.js). This process will result in the complete loss of all existing data in the database. It is crucial to note that this command is intended for use in development environments only.

node script.js: use this for when I am adding/re-adding data to the db.