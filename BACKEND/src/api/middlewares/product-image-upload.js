import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import multer from "multer";
import { __dirname } from "../utils/index.js";

const uploadsDirectory = join(__dirname, "uploads");
const allowedMimeTypes = new Set([
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp"
]);

const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter(req, file, callback) {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return callback(new Error("El archivo debe ser PNG, JPG, GIF o WebP."));
        }

        callback(null, true);
    }
});

const detectImageExtension = (buffer) => {
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return "png";
    }

    if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
        return "jpg";
    }

    if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) {
        return "gif";
    }

    if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
        return "webp";
    }

    return null;
};

export const parseProductImage = (req, res, next) => {
    multerUpload.single("imageFile")(req, res, (error) => {
        if (error) {
            const status = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
                ? 413
                : 400;
            return res.status(status).json({ message: error.message });
        }

        if (req.file) {
            const extension = detectImageExtension(req.file.buffer);
            if (!extension) {
                return res.status(400).json({
                    message: "El archivo no contiene una imagen válida."
                });
            }

            req.file.detectedExtension = extension;
        }

        next();
    });
};

export const storeProductImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const fileName = `${randomUUID()}.${req.file.detectedExtension}`;
    const filePath = join(uploadsDirectory, fileName);

    try {
        await mkdir(uploadsDirectory, { recursive: true });
        await writeFile(filePath, req.file.buffer, { flag: "wx" });
        req.body.image = `/uploads/${fileName}`;
        req.uploadedImagePath = filePath;
        next();
    } catch (error) {
        next(error);
    }
};
