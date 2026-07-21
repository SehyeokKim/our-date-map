import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

export async function uploadCompressedPhoto(file: File): Promise<string | null> {
  try {
    // 1. 이미지 압축 옵션 설정
    const options = {
      maxSizeMB: 0.3,          // 최대 300KB
      maxWidthOrHeight: 1200,   // 최대 해상도 1200px
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);

    // 2. 고유한 파일명 생성
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;

    // 3. Supabase Storage 업로드
    const { data, error } = await supabase.storage
      .from('date-photos')
      .upload(fileName, compressedFile);

    if (error) throw error;

    // 4. 공개 접근 가능한 사진 URL 반환
    const { data: publicUrlData } = supabase.storage
      .from('date-photos')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return null;
  }
}