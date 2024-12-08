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
    if (!file) {
      return new Response("File not found", { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult: IUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
            {
            resource_type: "auto",
            folder: "images",
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
    return NextResponse.json(
        {
            publicId: uploadResult.public_id,
        },{
            status:200
        }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({err:"Upload Video Failed"},{status:500})
  }
  finally {
    await prisma.$disconnect();
  }
}
