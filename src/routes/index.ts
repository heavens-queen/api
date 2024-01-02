import express, { Request, Response } from "express";
import multer from "multer";
import { UploadImages } from "../IMAGES/Uploads/index.js";
import { deleteImageAndThumbnail } from "../IMAGES/Delete/deletSpecificImages.js";
import { deleteImagesContainer } from "../IMAGES/Delete/destroyImageContainer.js";
import { deleteUsersFiles } from "../helper/deleteUsersFiles/index.js";
import { uploadVideo } from "../VIDEOS/Uploads/index.js";
import { testing } from "../testing.js";
import os from 'os';
import path from 'path';
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

const router=express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.get("/api", (req:Request, res:Response) => {
    res.send("api working succesful!");
  });

//   router.post("/api/auth/signup", registerUser);
//   router.post("/api/auth/login", loginUser);
//   router.route('/api/users/').get(getAllUsers);
//   router.route('/api/users/:id').get(getSingleUser).patch(authenticateToken,UpdateUser).delete(authenticateToken,deleteUser)


const storeTemp = multer({ dest: path.join(os.tmpdir(), 'mediaglens') });
// images
router.put('/api/upload-images/',upload.array('images'),UploadImages);
router.delete('/api/delete-images/',deleteImageAndThumbnail);
router.delete('/api/destroy-images-folder/',deleteImagesContainer);

///upload video
router.put('/api/upload-video/',storeTemp.single('video'),uploadVideo);
router.delete('/api/delete-video/',deleteVideoAndThumbnail);
router.delete('/api/destroy-videouploadFiless-folder/',deletevideosContainer);


//danger zone " user file"
router.delete('/api/destroy-User-folder/',deleteUsersFiles);
///docs/pdfs/
router.put('/api/upload-files/',storeTemp.array('files'),uploadFiles);




  export default  router