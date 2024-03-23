import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto"
        }
        )

        // when file successfully uploaded on cloudinary then it will be revmoved from it from public folder
        fs.unlinkSync(localFilePath);

        return response;
        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url);
    } catch (error) {
        fs.unlinkSync(localFilePath);   // remove the locally saved temporary file as the upload operation got failed

    }
}

export { uploadOnCloudinary }