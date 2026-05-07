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

IMPORTANT: You must output ONLY a valid, raw JSON object. Do not include markdown formatting (like \`\`\`json) or any conversational text.

CORE TASK: 
Analyze the image to identify the primary inanimate waste or recyclable object.

HUMAN/ANIMAL HANDLING RULES:
1. STRICT RULE: IGNORE human hands, arms, or bodies if they are holding or interacting with the object. Analyze the object itself.
2. If the image is EXCLUSIVELY a human face or a live animal with no clear waste object, return "Invalid" for objectName.

ESTIMATION DATA:
- scrapValuePH: Provide realistic current scrap market rates in the Philippines (PHP) per kg or piece. If zero, state "No commercial value".
- upcyclingSuggestion: Provide a highly practical, creative, and specific household upcycling idea.

STRUCTURE:
{
  "objectName": "Specific name of the object (or 'Invalid')",
  "category": "Broad material category (e.g., Plastic, E-Waste, Glass, Metal)",
  "upcyclingSuggestion": "Detailed actionable step for household reuse.",
  "description": "Brief visual description of the object's condition and material.",
  "scrapValuePH": "Estimated price in PHP (e.g., '15.00 PHP/kg')",
  "recyclingUses": "How local PH recycling facilities process this.",
  "isHazardous": false,
  "hazardDetails": "Safety warnings or 'Safe to handle'",
  "isBiodegradable": false,
  "isRecyclable": true
}
Final Instruction: Ensure the output is strictly formatted JSON.`
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
    
    // Safety check to strip any markdown formatting the AI might still try to inject
    let rawContent = data.choices[0].message.content;
    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const aiData = JSON.parse(rawContent);

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