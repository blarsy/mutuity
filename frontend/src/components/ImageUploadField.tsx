import { useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";

import { RESOURCE_IMAGE_SIZE, uploadImage, urlFromPublicId } from "../services/images";

type Props = {
  imageUrls: string[];
  onImageAdded: (url: string) => void;
  onImageRemoved: (index: number) => void;
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

export function ImageUploadField({ imageUrls, onImageAdded, onImageRemoved }: Props) {
  const { t } = useTranslation("resources");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completeCrop, setCompleteCrop] = useState<Crop | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [fileFormatError, setFileFormatError] = useState(false);

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
      onImageAdded(url);
      setImageFile(undefined);
      setCrop(undefined);
      setCompleteCrop(undefined);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("imageUpload.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t("imageUpload.title")}</Typography>

      {imageUrls.length > 0 && (
        <ImageList cols={3} rowHeight={120} sx={{ mt: 0 }}>
          {imageUrls.map((url, index) => (
            <ImageListItem key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={t("imageUpload.imageAlt", { index: index + 1 })} style={{ objectFit: "cover", height: "100%" }} />
              <ImageListItemBar
                actionIcon={
                  <IconButton
                    size="small"
                    onClick={() => onImageRemoved(index)}
                    aria-label={t("imageUpload.removeImage")}
                    sx={{ color: "white" }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                position="top"
                sx={{ background: "transparent" }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {!imageFile && (
        <Box
          sx={{
            border: isDraggedOver ? "2px solid" : "2px dashed",
            borderColor: isDraggedOver ? "primary.main" : "divider",
            borderRadius: 1,
            p: 2,
            textAlign: "center",
            opacity: isDraggedOver ? 0.6 : 1,
            cursor: "pointer",
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
            {t("imageUpload.selectFile")}
          </Button>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("imageUpload.dragHint")}
          </Typography>
        </Box>
      )}

      {imageFile && (
        <Stack spacing={1}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompleteCrop(c)}
            aspect={1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={URL.createObjectURL(imageFile)}
              alt={t("imageUpload.previewAlt")}
              style={{ maxWidth: "100%" }}
            />
          </ReactCrop>

          {!crop && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {t("imageUpload.cropHint")}
            </Typography>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              size="small"
              disabled={!completeCrop || uploading}
              onClick={handleUpload}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {t("imageUpload.upload")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={uploading}
              onClick={() => {
                setImageFile(undefined);
                setCrop(undefined);
                setCompleteCrop(undefined);
                setUploadError(null);
              }}
            >
              {t("imageUpload.cancel")}
            </Button>
          </Stack>
        </Stack>
      )}

      {fileFormatError && (
        <Alert severity="error" onClose={() => setFileFormatError(false)}>
          {t("imageUpload.fileFormatError")}
        </Alert>
      )}

      {uploadError && (
        <Alert severity="error" onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}
    </Stack>
  );
}
