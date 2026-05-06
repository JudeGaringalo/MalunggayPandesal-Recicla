import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using environment variables
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

    // Prepare image data for upload
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `scan_${Date.now()}.jpg`;

    // 1. UPLOAD TO SUPABASE
    const { error: uploadError } = await supabase.storage
      .from('scans')
      .upload(fileName, buffer, { contentType: 'image/jpeg' });

    if (uploadError) throw new Error(`Supabase: ${uploadError.message}`);
    
    const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(fileName);

    // 2. ANALYZE WITH GROQ (Llama 3.2 Vision)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // CHANGE THIS LINE:
        model: "meta-llama/llama-4-scout-17b-16e-instruct", 
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                // Change your content text in route.ts to this:
                // Replace the existing text property with this updated prompt:
                text: "Analyze this waste item for the Philippines. Return ONLY JSON: {\"match\": {\"className\": \"Name\", \"probability\": 0.95}, \"mapped\": {\"category\": \"Cat\", \"value\": \"₱0\", \"hazard\": false, \"biodegradable\": false, \"action\": \"Recycle\"}}"
              },
              { 
                type: "image_url", 
                image_url: { url: image } 
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
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