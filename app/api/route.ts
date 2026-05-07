import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log("DEBUG: Key starts with:", process.env.GROQ_API_KEY?.slice(0, 10));

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `scan_${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('scans')
      .upload(fileName, buffer, { contentType: 'image/jpeg' });

    if (uploadError) throw new Error(`Supabase: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(fileName);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert waste management and materials science AI. 
          
          CORE TASK: Analyze the provided image and identify the primary inanimate object in the center. 
          Estimate real-world data regarding scrap value in the Philippines (PHP), biodegradability, and recycling methods.

          SAFETY & PRIVACY GUARDRAIL: 
          If the image contains a human face, any animal, you MUST NOT provide an analysis. 
          Instead, return the JSON structure with "objectName" set to "Invalid" and all other string fields set to "N/A".

          REQUIREMENTS:
          - Use real Philippine junk shop rates.
          - Return ONLY a valid, raw JSON object.

          STRUCTURE:
          {
            "objectName": "Exact name of the object (or 'Invalid' if person/animal)",
            "category": "Broad category (e.g., E-Waste, Metal)",
            "description": "Visual description of material composition.",
            "scrapValuePH": "Current price in PHP or 'No commercial value'",
            "recyclingUses": "Local industrial uses in PH.",
            "isHazardous": false,
            "hazardDetails": "Handling warnings or 'Safe to handle'",
            "isBiodegradable": false,
            "isRecyclable": true
          }`
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiData = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      aiData
    });

  } catch (error: any) {
    console.error("API ROUTE ERROR:", error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}