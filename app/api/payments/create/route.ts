import { NextResponse } from 'next/server';
import { createPayment } from '@/services/payment/payment-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Create payment token first
    const paymentDetails = await createPayment({
      amount: body.amount,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      description: body.description,
      metadata: body.metadata // Pass through all metadata for later use
    });
    
    if (!paymentDetails || !paymentDetails.token) {
      return NextResponse.json(
        { error: 'Failed to generate payment token' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      token: paymentDetails.token,
      metadata: body.metadata // Return metadata for use after payment success
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
} 