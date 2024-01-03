import express, { Request, Response } from "express";
import multer from "multer";
import { UploadImages } from "../IMAGES/Uploads/index.js";
import { deleteImageAndThumbnail } from "../IMAGES/Delete/deletSpecificImages.js";
import { deleteImagesContainer } from "../IMAGES/Delete/destroyImageContainer.js";
import { deleteUsersFiles } from "../helper/deleteUsersFiles/index.js";
import { uploadVideo } from "../VIDEOS/Uploads/index.js";
import { testing } from "../testing.js";
import os from "os";
import path from "path";
import { deleteVideoAndThumbnail } from "../VIDEOS/deleteVideo/deleteVideo.js";
import { deletevideosContainer } from "../VIDEOS/deleteVideo/DestroVideoContainer.js";
import { uploadFiles } from "../DOCS/Upload/index.js";
// import { registerUser } from "../Controllers/auth/Signup.js";
// import { loginUser } from "../Controllers/auth/login.js";
// import { getAllUsers } from "../Controllers/users/getAllUsers.js";
// import getSingleUser from "../Controllers/users/getSingleUser.js";
// import authenticateToken from "../middleware/AuthMiddleware.js";
// import UpdateUser from "../Controllers/users/updateUser.js";
// import deleteUser from "../Controllers/users/deleteUsers.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.get("/api", (req: Request, res: Response) => {
  res.send("api working succesful!");
});

//   router.post("/api/auth/signup", registerUser);
//   router.post("/api/auth/login", loginUser);
//   router.route('/api/users/').get(getAllUsers);
//   router.route('/api/users/:id').get(getSingleUser).patch(authenticateToken,UpdateUser).delete(authenticateToken,deleteUser)

const storeTemp = multer({ dest: path.join(os.tmpdir(), "mediaglens") });
// images
/**
 *   @openapi
 * paths:
 *   /api/upload-images:
 *     put:
 *       tags:
 *         - IMAGES 
 *       summary: Upload images
 *       description: Upload images to the server. Supports multiple file uploads.
 *       security:
 *         - ApiKeyAuth: []
 *         - UserIdAuth: []
 *       parameters:
 *         - in: header
 *           name: x-api-key
 *           description: API key
 *           required: true
 *         - in: header
 *           name: x-user-id
 *           description: User ID
 *           required: true
 *         - in: query
 *           name: width
 *           description: Width of the image.
 *           required: false
 *           schema:
 *             type: integer
 *         - in: query
 *           name: height
 *           description: Height of the image.
 *           required: false
 *           schema:
 *             type: integer
 *         - in: query
 *           name: quality
 *           description: Quality of the image (default is 80).
 *           required: false
 *           schema:
 *             type: integer
 *         - in: query
 *           name: crop
 *           description: Crop parameters in the order left, top, width, height.
 *           required: false
 *           schema:
 *             type: string
 *         - in: query
 *           name: progressive
 *           description: Enable progressive rendering.
 *           required: false
 *           schema:
 *             type: boolean
 *         - in: query
 *           name: grayscale
 *           description: Convert the image to grayscale.
 *           required: false
 *           schema:
 *             type: boolean
 *         - in: query
 *           name: rotate
 *           description: Rotation angle of the image.
 *           required: false
 *           schema:
 *             type: integer
 *         - in: query
 *           name: format
 *           description: Output format of the image (default is "original").
 *           required: false
 *           schema:
 *             type: string.
 *       requestBody:
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: file
 *       responses:
 *         "200":
 *           description: Images uploaded successfully
 *         "400":
 *           description: Bad Request. Indicates invalid parameters.
 *           content:
 *             application/json:
 *               example:
 *                 error: "Invalid parameters. Provide valid values for width, height, quality, crop, progressive, grayscale, rotate, and format."
 *         "401":
 *           description: Unauthorized. Indicates missing or invalid API key or user ID.
 *           content:
 *             application/json:
 *               example:
 *                 error: "Invalid API key or user ID. Please provide valid credentials."
 *         "404":
 *           description: Not Found. Indicates the endpoint is not found.
 *           content:
 *             application/json:
 *               example:
 *                 error: "Endpoint not found."
 *         "500":
 *           description: Internal Server Error. Indicates a server error.
 *           content:
 *             application/json:
 *               example:
 *                 error: "Internal Server Error. Please try again later."
 */
router.put("/api/upload-images/", upload.array("images"), UploadImages);
/**
 *     @openapi
 * paths:
 *   /api/delete-images/:
 *     delete:
 *       tags:
 *         - IMAGES
 *       summary: Delete images
 *       description: Delete images from the server. Requires user authentication and images keys obtained during image uploads.
 *       security:
 *         - ApiKeyAuth: []
 *         - UserIdAuth: []
 *       parameters:
 *         - in: header
 *           name: x-api-key
 *           description: API key
 *           required: true
 *         - in: header
 *           name: x-user-id
 *           description: User ID
 *           required: true
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of image keys obtained during image uploads.
 *       responses:
 *         "200":
 *           description: Images deleted successfully
 *         "400":
 *           description: Bad Request. Indicates invalid parameters.
 *           content:
 *             application/json:
 *               example:
 *                 error: "Invalid parameters. Provide valid values for images."
 *         "401":
 *           description: Unauthorized. Indicates missing or invalid API key or user ID.
 *           content:
 *             application/json:
 *               example:
 *                 error: "Invalid API key or user ID. Please provide valid credentials."
 *         "404":
 *           description: Not Found. Indicates no files found with the specified key.
 *           content:
 *             application/json:
 *               example:
 *                 error: 'No files found with the specified key.'
 *         "500":
 *           description: Internal Server Error. Indicates a server error.
 *           content:
 *             application/json:
 *               example:
 *                 error: "Internal Server Error. Please try again later."
 */
router.delete("/api/delete-images/", deleteImageAndThumbnail);

/**
 * @swagger
 * paths:
 *   /api/destroy-images-folder/:
 *     delete:
 *       tags:
 *         - IMAGES
 *       summary: DANGER ZONE **Destroy images folder**
 *       description: WARNING! Irreversibly deletes all images associated with the user ID. This operation cannot be undone.
 *       security:
 *         - ApiKeyAuth: []
 *         - UserIdAuth: []
 *       parameters:
 *         - in: header
 *           name: x-api-key
 *           description: API key
 *           required: true
 *         - in: header
 *           name: x-user-id
 *           description: User ID
 *           required: true
 *       responses:
 *         "200":
 *           description: Images folder destroyed successfully
 *         "401":
 *           description: Unauthorized. Indicates missing or invalid API key or user ID.
 *           content:
 *             application/json:
 *               example:
 *                 error: 'Invalid API key or user ID. Please provide valid credentials.'
 *         "404":
 *           description: Not Found. Indicates no images found for the provided user ID.
 *           content:
 *             application/json:
 *               example:
 *                 error: 'No images found for the provided user ID.'
 *         "500":
 *           description: Internal Server Error. Indicates a server error.
 *           content:
 *             application/json:
 *               example:
 *                 error: 'Internal Server Error. Please try again later.'
 */
router.delete("/api/destroy-images-folder/", deleteImagesContainer);
///upload video
router.put("/api/upload-video/", storeTemp.single("video"), uploadVideo);
router.delete("/api/delete-video/", deleteVideoAndThumbnail);
router.delete("/api/destroy-videouploadFiless-folder/", deletevideosContainer);

//danger zone " user file"
router.delete("/api/destroy-User-folder/", deleteUsersFiles);

///docs/pdfs/ppts upload
router.put("/api/upload-files/", storeTemp.array("files"), uploadFiles);

export default router;
