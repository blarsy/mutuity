import { useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";

import { RESOURCE_IMAGE_SIZE, uploadImage, urlFromPublicId } from "../../services/images";

type Props = {
  open: boolean;
  onClose: () => void;
  onImagesAdded: (urls: string[]) => void;
  maxImages: number;
  currentImageUrls: string[];
};

async function cropAndUpload(image: HTMLImageElement, crop: Crop): Promise<string> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  const canvas = new OffscreenCanvas(RESOURCE_IMAGE_SIZE, RESOURCE_IMAGE_SIZE);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  ctx.save();
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX * pixelRatio,
    crop.height * scaleY * pixelRatio,
    0,
    0,
    RESOURCE_IMAGE_SIZE,
    RESOURCE_IMAGE_SIZE,
  );
  ctx.restore();

  const blob = await canvas.convertToBlob({ type: "image/png" });
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
  });

  const publicId = await uploadImage(base64);
  return urlFromPublicId(publicId);
}

export function ChatImageUploadDialog({
  open,
  onClose,
  onImagesAdded,
  maxImages,
  currentImageUrls,
}: Props) {
  const { t: tChat } = useTranslation("chat");
  const { t: tCommon } = useTranslation("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completeCrop, setCompleteCrop] = useState<Crop | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [fileFormatError, setFileFormatError] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleFileSelected = (file: File) => {
    if (file.type.match(/^image\/(gif|png|jpg|jpeg|webp)$/)) {
      setImageFile(file);
      setCrop(undefined);
      setCompleteCrop(undefined);
      setUploadError(null);
      setFileFormatError(false);
    } else {
      setFileFormatError(true);
    }
  };

  const handleUpload = async () => {
    if (!imgRef.current || !completeCrop) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await cropAndUpload(imgRef.current, completeCrop);
      setUploadedUrls([...uploadedUrls, url]);
      setImageFile(undefined);
      setCrop(undefined);
      setCompleteCrop(undefined);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : tChat("imageUpload.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedUrls(uploadedUrls.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setImageFile(undefined);
    setCrop(undefined);
    setCompleteCrop(undefined);
    setUploadError(null);
    setFileFormatError(false);
    setUploadedUrls([]);
    onClose();
  };

  const handleConfirm = () => {
    onImagesAdded(uploadedUrls);
    handleClose();
  };

  const canAddMore = uploadedUrls.length < maxImages;
  const totalImages = currentImageUrls.length + uploadedUrls.length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tChat("imageUpload.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {uploadError && (
            <Alert severity="error" onClose={() => setUploadError(null)}>
              {uploadError}
            </Alert>
          )}

          {fileFormatError && (
            <Alert severity="error" onClose={() => setFileFormatError(false)}>
              {tChat("imageUpload.fileFormatError")}
            </Alert>
          )}

          {totalImages >= maxImages && !imageFile && (
            <Alert severity="warning">
              {tChat("imageUpload.maxImagesReached", { max: maxImages })}
            </Alert>
          )}

          {/* Uploaded images preview */}
          {uploadedUrls.length > 0 && (
            <Box>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                {tChat("imageUpload.uploadedImages", { count: uploadedUrls.length, max: maxImages })}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                {uploadedUrls.map((url, index) => (
                  <Box key={url} sx={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
                    <Box
                      sx={{
                        backgroundImage: `url(${url})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        borderRadius: 1,
                        inset: 0,
                        position: "absolute",
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      aria-label={tChat("imageUpload.removeImage")}
                      sx={{
                        color: "white",
                        position: "absolute",
                        right: 4,
                        top: 4,
                        bgcolor: "rgba(0, 0, 0, 0.45)",
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.6)" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* File selection or crop UI */}
          {!imageFile && canAddMore && (
            <Box
              sx={{
                border: isDraggedOver ? "2px solid" : "2px dashed",
                borderColor: isDraggedOver ? "primary.main" : "divider",
                borderRadius: 1,
                p: 2,
                minHeight: 176,
                textAlign: "center",
                opacity: isDraggedOver ? 0.6 : 1,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onDragEnter={() => setIsDraggedOver(true)}
              onDragLeave={() => setIsDraggedOver(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggedOver(false);
                if (e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/gif,image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                }}
              />
              <Button variant="outlined" size="small" onClick={() => fileInputRef.current?.click()}>
                {tChat("imageUpload.selectFile")}
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {tChat("imageUpload.dragHint")}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <AspectRatioIcon sx={{ color: "text.primary", fontSize: "4rem" }} />
              </Box>
            </Box>
          )}

          {/* Crop UI */}
          {imageFile && (
            <Stack spacing={1}>
              <Typography variant="caption" display="block">
                {tChat("imageUpload.cropHint")}
              </Typography>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompleteCrop(c)}
                aspect={1}
                circularCrop={false}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  alt="crop"
                  src={URL.createObjectURL(imageFile)}
                  style={{ maxWidth: "100%" }}
                />
              </ReactCrop>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{tCommon("actions.cancel")}</Button>
        {imageFile ? (
          <Button
            variant="contained"
            onClick={() => void handleUpload()}
            disabled={!completeCrop || uploading}
          >
            {uploading ? <CircularProgress size={20} /> : tChat("imageUpload.uploadImage")}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={uploadedUrls.length === 0}
          >
            Ok
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
