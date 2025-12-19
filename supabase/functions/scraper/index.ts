import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { url } = await req.json()
    const response = await fetch(url)
    const html = await response.text()
    
    // Parse the HTML
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse HTML");

    // 1. Extract Title
    const title = doc.querySelector("title")?.textContent || "No Title Found";

    // 2. Extract Headings (H1 and H2)
    const headings = Array.from(doc.querySelectorAll("h1, h2"))
      .map(h => h.textContent.trim())
      .filter(t => t.length > 0);

    // 3. Extract Images
    const images = Array.from(doc.querySelectorAll("img"))
      .map(img => img.getAttribute("src"))
      .filter(src => src && src.startsWith("http")); // Only full URLs

    // 4. Extract Links
    const links = Array.from(doc.querySelectorAll("a"))
      .map(a => a.getAttribute("href"))
      .filter(href => href && href.startsWith("http"))
      .slice(0, 20); // Limit to top 20 links

    // 5. Extract Meta Description
    const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";

    return new Response(
      JSON.stringify({ 
        title, 
        headings, 
        images, 
        links, 
        meta: { description } 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})