import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { uploadBase64Image } from '@/lib/uploadUtils';

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Get base64 images from form data
    const bracelet1Image = formData.get('bracelet1');
    const bracelet2Image = formData.get('bracelet2');
    const bracelet1Config = JSON.parse(formData.get('bracelet1_config'));
    const bracelet2Config = JSON.parse(formData.get('bracelet2_config'));
    const userId = formData.get('userId'); // Optional

    // Convert blobs to base64
    const bracelet1Base64 = await blobToBase64(bracelet1Image);
    const bracelet2Base64 = await blobToBase64(bracelet2Image);

    // Upload to Cloudinary
    const bracelet1Url = await uploadBase64Image(bracelet1Base64, 'bracelets');
    const bracelet2Url = await uploadBase64Image(bracelet2Base64, 'bracelets');

    // Save to database using Prisma
    const bracelet = await db.configuration.create({
      data: {
        userId: userId || null,
        bracelet1ImageUrl: bracelet1Url,
        bracelet2ImageUrl: bracelet2Url,
        bracelet1Config: bracelet1Config,
        bracelet2Config: bracelet2Config,
      },
    });

    return NextResponse.json({
      success: true,
      data: bracelet,
      message: 'Bracelet design saved successfully!'
    });

  } catch (error) {
    console.error('Error in POST /api/bracelets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save bracelet design',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    let bracelets;

    if (id) {
      // Get single bracelet by ID
      bracelets = await db.configuration.findUnique({
        where: { id },
      });
    } else if (userId) {
      // Get all bracelets for a user
      bracelets = await db.configuration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Get all bracelets
      bracelets = await db.configuration.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit results
      });
    }

    return NextResponse.json({
      success: true,
      data: bracelets
    });

  } catch (error) {
    console.error('Error in GET /api/bracelets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch bracelets',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper function to convert blob to base64
async function blobToBase64(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${blob.type};base64,${buffer.toString('base64')}`;
}