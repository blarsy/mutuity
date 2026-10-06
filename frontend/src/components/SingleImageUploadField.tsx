import { useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Alert, Avatar, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ACCEPTED_IMAGE_TYPES, cropAndUpload, isSupportedImageFile } from "./ImageUploadField";
import { ZoomableImage } from "./ZoomableImage";

type Props = {
  imageUrl: string | null;
  onImageChanged: (url: string) => void;
  onImageRemoved?: () => void;
  alt: string;
  circular?: boolean;
  size?: number;
};

export function SingleImageUploadField({
  imageUrl,
  onImageChanged,
  onImageRemoved,
  alt,
  circular = false,
  size = 300
}: Props) {
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

  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetSelection = () => {
    setImageFile(undefined);
    setCrop(undefined);
    setCompleteCrop(undefined);
  };

  const handleFileSelected = (file: File) => {
    if (isSupportedImageFile(file)) {
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
      onImageChanged(url);
      resetSelection();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("imageUpload.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const borderRadius = circular ? "50%" : 1;
  const dimensions = {
    height: size,
    width: size,
    maxHeight: `min(${size}px, 75vw)`,
    maxWidth: `min(${size}px, 75vw)`
  };

  return (
    <Stack alignItems="center" spacing={1.5}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
          e.target.value = "";
        }}
      />

      {imageFile && previewUrl ? (
        <Stack spacing={1} sx={{ maxWidth: "100%" }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompleteCrop(c)}
            aspect={1}
            circularCrop={circular}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={previewUrl} alt={t("imageUpload.previewAlt")} style={{ maxWidth: "100%" }} />
          </ReactCrop>

          {!crop && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {t("imageUpload.cropHint")}
            </Typography>
          )}

          <Stack direction="row" spacing={1} justifyContent="center">
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
                resetSelection();
                setUploadError(null);
              }}
            >
              {t("imageUpload.cancel")}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <>
          <Box
            onDragEnter={() => setIsDraggedOver(true)}
            onDragLeave={() => setIsDraggedOver(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggedOver(false);
              if (e.dataTransfer.files[0]) handleFileSelected(e.dataTransfer.files[0]);
            }}
            sx={{
              borderRadius,
              outline: isDraggedOver ? "3px dashed" : "none",
              outlineColor: "primary.main",
              outlineOffset: 4,
              opacity: isDraggedOver ? 0.6 : 1
            }}
          >
            {imageUrl ? (
              <ZoomableImage alt={alt} src={imageUrl} sx={{ ...dimensions, borderRadius, objectFit: "cover", display: "block" }} />
            ) : (
              <Avatar
                alt={alt}
                onClick={() => fileInputRef.current?.click()}
                variant={circular ? "circular" : "rounded"}
                sx={{ ...dimensions, cursor: "pointer" }}
              />
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={() => fileInputRef.current?.click()}>
              {imageUrl ? t("imageUpload.changeImage") : t("imageUpload.chooseImage")}
            </Button>
            {imageUrl && onImageRemoved && (
              <Button color="error" size="small" onClick={onImageRemoved}>
                {t("imageUpload.removeImage")}
              </Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t("imageUpload.dragOnImageHint")}
          </Typography>
        </>
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
