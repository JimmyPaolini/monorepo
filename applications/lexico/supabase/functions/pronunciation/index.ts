// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PronunciationRequest {
  text: string;
  dialect?: "classical" | "ecclesiastical";
}

interface PollyResponse {
  AudioStream: Uint8Array;
}

/**
 * Generate pronunciation audio using AWS Polly
 */
async function generatePronunciation(
  text: string,
  dialect: "classical" | "ecclesiastical",
): Promise<Uint8Array> {
  const awsAccessKey = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const awsRegion = Deno.env.get("AWS_REGION") ?? "us-east-1";

  if (!awsAccessKey || !awsSecretKey) {
    throw new Error("AWS credentials not configured");
  }

  // Use Italian voice for ecclesiastical Latin, otherwise use a neutral voice
  // Giorgio (Italian) is good for ecclesiastical, Matthew (US) for classical
  const voiceId = dialect === "ecclesiastical" ? "Giorgio" : "Matthew";

  // AWS Polly endpoint
  const endpoint = `https://polly.${awsRegion}.amazonaws.com/v1/speech`;

  const body = JSON.stringify({
    OutputFormat: "mp3",
    Text: text,
    VoiceId: voiceId,
    Engine: "neural",
    LanguageCode: dialect === "ecclesiastical" ? "it-IT" : "en-US",
  });

  // Create AWS Signature v4
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const host = `polly.${awsRegion}.amazonaws.com`;
  const canonicalUri = "/v1/speech";
  const canonicalQuerystring = "";
  const payloadHash = await sha256(body);

  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-date";

  const canonicalRequest = [
    "POST",
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${awsRegion}/polly/aws4_request`;

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(
    awsSecretKey,
    dateStamp,
    awsRegion,
    "polly",
  );

  const signature = await hmacSha256Hex(signingKey, stringToSign);

  const authorizationHeader = `${algorithm} Credential=${awsAccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Date": amzDate,
      Authorization: authorizationHeader,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Polly error:", errorText);
    throw new Error(`Polly API error: ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

// Helper functions for AWS Signature v4
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  message: string,
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
}

async function hmacSha256Hex(
  key: ArrayBuffer | Uint8Array,
  message: string,
): Promise<string> {
  const result = await hmacSha256(key, message);
  return Array.from(new Uint8Array(result))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string,
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDate = await hmacSha256(encoder.encode(`AWS4${key}`), dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  return await hmacSha256(kService, "aws4_request");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, dialect = "classical" } =
      (await req.json()) as PronunciationRequest;

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate audio
    const audioData = await generatePronunciation(text, dialect);

    // Return audio as base64
    const base64Audio = btoa(String.fromCharCode(...audioData));

    return new Response(
      JSON.stringify({
        audio: base64Audio,
        contentType: "audio/mpeg",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Pronunciation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
