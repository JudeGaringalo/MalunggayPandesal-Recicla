import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for item catalog and scrap pricing [cite: 25]
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini AI 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    if (!image) return NextResponse.json({ success: false, error: 'No image provided.' }, { status: 400 });

    // Clean base64 data for Gemini
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `scan_${Date.now()}.jpg`;

    // 1. SUPABASE UPLOAD (Isolated)
    let publicUrl = '';
    const { error: uploadError } = await supabase.storage.from('scans').upload(fileName, buffer, { contentType: 'image/jpeg' });
    if (uploadError) throw new Error(`Supabase Error: ${uploadError.message}`);
    publicUrl = supabase.storage.from('scans').getPublicUrl(fileName).data.publicUrl;

    // 2. GEMINI ANALYSIS (The Google Lens "Payoff") [cite: 67, 68]
    // Use the absolute stable model name to avoid the 404 v1beta error
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });
    
    const prompt = `
      You are an expert waste segregation AI for the circular economy in the Philippines. 
      Analyze this image and identify the dominant recyclable or e-waste item[cite: 11].
      
      Return ONLY a raw JSON object with this exact structure:
      {
        "match": {
          "className": "Specific Item Name (e.g., Insulated Copper Wire)",
          "probability": 0.95
        },
        "mapped": {
          "category": "Broad Category (e.g., E-Waste, Metal, Plastic)",
          "value": "₱ Price per kg (e.g., ₱300/kg)",
          "hazard": true or false
        }
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);
    
    const responseText = result.response.text();
    
    // Clean potential markdown and parse JSON
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(cleanJson);

    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl, 
      aiData: aiData 
    });

  } catch (error: any) {
    console.error("ANALYSIS FAILED:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}