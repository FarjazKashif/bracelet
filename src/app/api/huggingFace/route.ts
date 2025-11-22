// app/api/generate-ai-bracelet/route.ts
import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import { uploadBase64Image } from '@/lib/uploadUtils';
import { db } from '@/db/index';

export async function POST(request: Request) {
  try {
    const { bracelet1Url, bracelet2Url, configurationId } = await request.json();

    console.log('Starting AI generation...');
    console.log('Bracelet 1 URL:', bracelet1Url);
    console.log('Bracelet 2 URL:', bracelet2Url);

    // Initialize Hugging Face Inference
    const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

    // Generate AI image using text-to-image
    const prompt = `Professional jewelry product photography, two elegant handmade beaded bracelets displayed side by side on white surface, colorful glass beads, studio lighting, commercial product photo, high detail, 4k, professional photography`;

    console.log('Sending to Hugging Face AI...');
    console.log('Using model: stabilityai/stable-diffusion-2-1');

    // Generate image
    const imageBlob = await hf.textToImage({
      model: 'stabilityai/stable-diffusion-2-1',
      inputs: prompt,
      parameters: {
        negative_prompt: 'blurry, low quality, distorted, ugly',
      }
    });

    console.log('AI generation complete!');

    // Convert blob to base64 for Cloudinary
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    // Upload AI-generated image to Cloudinary
    console.log('Uploading to Cloudinary...');
    const aiImageUrl = await uploadBase64Image(base64Image, 'ai-bracelets');
    console.log('Uploaded to Cloudinary:', aiImageUrl);

    // Save AI image URL to database
    if (configurationId) {
      await db.configuration.update({
        where: { id: configurationId },
        data: { aiGeneratedImageUrl: aiImageUrl }
      });
      console.log('Saved to database');
    }

    return NextResponse.json({
      success: true,
      aiImageUrl: aiImageUrl,
      message: 'AI image generated successfully!'
    });

  } catch (error: any) {
    console.error('AI Generation error:', error);
    console.error('Error details:', error.message);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI image',
        details: error.message
      },
      { status: 500 }
    );
  }
}