import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Companion } from '@/models';
import connectDB from '@/lib/mongodb';
import { uploadImage } from '@/lib/cloudinary';

// POST - Submit KYC documents
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { slug } = params;

    await connectDB();

    const companion = await Companion.findBySlug(slug);

    if (!companion) {
      return NextResponse.json(
        { success: false, message: 'Companion not found' },
        { status: 404 }
      );
    }

    // Check if user owns this profile
    if (companion.userId._id.toString() !== auth.user!._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle multipart form data
    const formData = await req.formData();
    const documents: any[] = [];

    // Process ID proof
    const idProof = formData.get('idProof') as File;
    if (idProof) {
      const bytes = await idProof.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${idProof.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadImage(base64Image, 'kyc/id-proof');
      
      documents.push({
        type: 'id_proof',
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
        verified: false,
      });
    }

    // Process address proof
    const addressProof = formData.get('addressProof') as File;
    if (addressProof) {
      const bytes = await addressProof.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${addressProof.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadImage(base64Image, 'kyc/address-proof');
      
      documents.push({
        type: 'address_proof',
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
        verified: false,
      });
    }

    // Process photo
    const photo = formData.get('photo') as File;
    if (photo) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${photo.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadImage(base64Image, 'kyc/photos');
      
      documents.push({
        type: 'photo',
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
        verified: false,
      });
    }

    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No documents provided' },
        { status: 400 }
      );
    }

    // Submit KYC
    await companion.submitKYC(documents);

    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted successfully',
      data: {
        status: companion.kyc.status,
        documents: companion.kyc.documents,
      },
    });
  } catch (error: any) {
    console.error('KYC submission error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit KYC' },
      { status: 500 }
    );
  }
}
