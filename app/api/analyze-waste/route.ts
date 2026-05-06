import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided from frontend.' }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `scan_${Date.now()}.jpg`;

    // 1. SUPABASE UPLOAD
    let publicUrl = '';
    try {
      const { error: uploadError } = await supabase.storage.from('scans').upload(fileName, buffer, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      publicUrl = supabase.storage.from('scans').getPublicUrl(fileName).data.publicUrl;
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Supabase Error: ${e.message}` }, { status: 500 });
    }

    // 2. GEMINI ANALYSIS
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        generationConfig: { responseMimeType: "application/json" } 
      });
      
      const prompt = `
        Analyze this image and identify the primary waste or recyclable item.
        Return ONLY a JSON object with this exact structure:
        {
          "match": {
            "className": "Specific Name of Item",
            "probability": 0.95
          },
          "mapped": {
            "category": "Broad Category",
            "value": "Estimated Scrap Value",
            "hazard": false
          }
        }
      `;

      const result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }]);
      const responseText = result.response.text();
      const aiData = JSON.parse(responseText);

      return NextResponse.json({ success: true, imageUrl: publicUrl, aiData: aiData });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Gemini Error: ${e.message}` }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: `Server Error: ${error.message}` }, { status: 500 });
  }
}