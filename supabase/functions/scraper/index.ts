// supabase/functions/scraper/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    // Added User-Agent to prevent some sites from blocking the request
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) throw new Error("Failed to parse site content");

    // Helper to resolve relative URLs to absolute ones
    const resolveUrl = (path: string | null) => {
      if (!path) return null;
      try {
        return new URL(path, url).href;
      } catch {
        return null;
      }
    };

    // Add these advanced selectors to your result object
const result = {
  title: doc.querySelector("title")?.textContent || doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || "No Title",
  
  // Capture H1 to H4 for better heading coverage
  headings: Array.from(doc.querySelectorAll("h1, h2, h3, h4"))
    .map((h) => (h as Element).textContent.trim())
    .filter(t => t.length > 2)
    .slice(0, 25),

  // Capture standard images + OpenGraph images (thumbnails)
  images: Array.from(doc.querySelectorAll("img, [style*='background-image'], meta[property='og:image']"))
    .map((el) => {
        const element = el as Element;
        if (element.tagName === "META") return element.getAttribute("content");
        if (element.getAttribute("src")) return element.getAttribute("src");
        // Extract from background-image: url(...)
        const style = element.getAttribute("style");
        const bgMatch = style?.match(/url\(['"]?(.*?)['"]?\)/);
        return bgMatch ? bgMatch[1] : null;
    })
    .map(src => resolveUrl(src))
    .filter((src): src is string => !!src && src.startsWith("http"))
    .slice(0, 20),


      // Fixed: Now resolves relative links (/about -> https://site.com/about)
      links: Array.from(doc.querySelectorAll("a"))
        .map((a) => resolveUrl((a as Element).getAttribute("href")))
        .filter((h): h is string => !!h && h.startsWith("http"))
        .slice(0, 20),

      meta: {
        description: doc.querySelector('meta[name="description"]')?.getAttribute("content") || 
                     doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || 
                     "No description found"
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});