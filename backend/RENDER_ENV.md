# Render Environment Variables for Dumela Stays

Required:
- PORT=5000
- MONGODB_URI=<MongoDB URI>
- JWT_SECRET=<random 32+ char secret>
- CORS_ORIGIN=<allowed origins>

Cloudinary (secure, never expose to frontend):
- CLOUDINARY_CLOUD_NAME=iwl5mcch
- CLOUDINARY_API_KEY=<provided securely>
- CLOUDINARY_API_SECRET=<provided securely>

Do NOT commit .env with secrets. Set these in Render Dashboard > Environment.
