import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase/client";

/**
 * Compress a single photo file before uploading
 */
export async function compressPhoto(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.3, // 300KB
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Image compression error:", error);
    return file; // Fallback to original file on compression error
  }
}

/**
 * Compress and upload a single photo file to Supabase Storage 'date-photos' bucket
 */
export async function uploadCompressedPhoto(file: File): Promise<string | null> {
  try {
    const compressedFile = await compressPhoto(file);

    const fileExt = compressedFile.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from("date-photos")
      .upload(filePath, compressedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("date-photos")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload compressed photo:", error);
    return null;
  }
}

/**
 * Compress and upload multiple photo files (up to 10 photos) to Supabase Storage
 */
export async function uploadCompressedPhotos(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const maxFiles = files.slice(0, 10);

  const uploadPromises = maxFiles.map((file) => uploadCompressedPhoto(file));
  const results = await Promise.all(uploadPromises);

  return results.filter((url): url is string => Boolean(url));
}

/**
 * Upload a single video file as-is (no transcoding/compression) to the 'date-photos' bucket.
 * iPhone HEVC(고효율) originals are uploaded untouched — they play natively on iOS devices.
 */
export async function uploadVideo(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop() || "mp4";
    const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("date-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/mp4",
      });

    if (error) {
      console.error("Supabase storage video upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("date-photos")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload video:", error);
    return null;
  }
}

/**
 * Upload multiple video files sequentially (large payloads — avoid parallel memory spikes on mobile)
 */
export async function uploadVideos(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadVideo(file);
    if (url) urls.push(url);
  }
  return urls;
}

/**
 * Compress and upload a user profile avatar photo to Supabase Storage 'avatars' bucket
 */
export async function uploadCompressedAvatar(userId: string, file: File): Promise<string | null> {
  try {
    const compressedFile = await compressPhoto(file);

    const fileExt = compressedFile.name.split(".").pop() || "png";
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, compressedFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase avatars storage upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload avatar photo:", error);
    return null;
  }
}