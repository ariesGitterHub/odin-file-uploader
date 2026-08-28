REMINDER TO SELF 
npx prisma migrate dev --name init: This is the command you use whenever you first initialize the schema prisma file, or change your schema prisma file.

npx prisma migrate reset: The command is specifically designed to reset your database and reapply all migrations (and seed.js). This process will result in the complete loss of all existing data in the database. It is crucial to note that this command is intended for use in development environments only.

node script.js: use this for when I am adding/re-adding data to the db.

When downloading a folder, any subfolder that does NOT have files will NOT have that empty subfolder downloaded via archiver/zip. The exception to this is if the subfolder that lacks files itself has a subfolder that has files. I'm okay with how this works. It cuts out anything that is empty and unneeded.

NOTES
All deletes in this app are hard delete, though I do have the db set up with a deleted_at column for soft deletes. Maybe add soft/hard delete set up later.
