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
                text: "You are an expert waste management and materials science AI. Analyze the provided image and strictly identify the primary object in the center of the frame. Estimate accurate, real-world data regarding this material's economic scrap value specifically in the Philippines (in PHP), its chemical biodegradability, and exact recycling methods. Do not guess blindly; base the value on real Philippine junk shop and recycling rates. If a value fluctuates, provide the current market range. Return ONLY a valid, raw JSON object matching this exact structure: {\"objectName\": \"Exact name of the object seen\", \"category\": \"Broad material category (e.g., High-Value Metal, E-Waste)\", \"description\": \"A highly accurate visual description of what you see and what the material is made of.\", \"scrapValuePH\": \"Exact current scrap value in Philippine Peso (e.g., '₱350 - ₱400 per kg') or 'No commercial scrap value'\", \"recyclingUses\": \"Specific industrial or local ways this material is recycled or repurposed in the Philippines.\", \"isHazardous\": true, \"hazardDetails\": \"Specific toxic properties or handling warnings. Write 'Safe to handle' if non-hazardous.\", \"isBiodegradable\": false, \"isRecyclable\": true}"
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