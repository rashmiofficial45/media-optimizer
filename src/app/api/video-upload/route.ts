import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
export const config = {
  runtime: "edge",
};

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface IUploadResult {
  public_id: string;
  [key:string]: any;
  bytes: number;
  duration?: number;
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return new Response("Cloudinary credentials not found", { status: 500 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;
    if (!file) {
      return new Response("File not found", { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult: IUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
            {
            resource_type: "video",
            folder: "videos",
            transformation: [
              {
                quality: "auto",
                fetch_format: "mp4",
              },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as IUploadResult);
            }
          }
        )
        .end(buffer);
    });
    console.log(uploadResult);
    const video = await prisma.video.create({
      data: {
        title,
        description,
        originalSize: originalSize,
        publicId: uploadResult.public_id,
        compressedSize: String(uploadResult.bytes),
        duration: uploadResult.duration || 0,
      },
    });
    return NextResponse.json(video);
  } catch (err) {
    console.log(err);
    return NextResponse.json({err:"Upload Video Failed"},{status:500})
  }
  finally {
    await prisma.$disconnect();
  }
}
