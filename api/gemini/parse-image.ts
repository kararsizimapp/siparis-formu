import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri desteklenir.' });
  }

  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Resim verisi bulunamadı." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Yapay zeka anahtarı (GEMINI_API_KEY) Vercel üzerinde tanımlı değil. Lütfen Vercel panelinizden Settings > Environment Variables bölümüne gidip 'GEMINI_API_KEY' adıyla kendi API anahtarınızı ekleyin." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    };

    const systemInstruction = `You are an expert OCR and data extraction system for a custom sportswear manufacturing order panel (KitForma).
Your job is to analyze the uploaded image of player lists or orders (which could be handwritten, printed, or spreadsheet screenshots) and extract all player records with their details:
1. Jersey Number (no) - numeric string (usually 1-3 digits). If not present, not specified or blank, return "".
2. Quantity (adet) - integer. If not present or not readable, default to 1.
3. Player Name and Surname (adiSoyadi) - Keep Turkish characters but clean up, filter to only letters and spaces, capitalize everything, converting characters to uppercase properly in Turkish (e.g. i->İ, ı->I, ş->Ş, ğ->Ğ, ç->Ç, ö->Ö, ü->Ü).
4. Shirt Size (ustBedeni) - Upper size. MUST match one of adult sizes: 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL' OR child sizes: '4 Yaş', '6 Yaş', '8 Yaş', '10 Yaş', '12 Yaş', '14 Yaş'. If they don't want a shirt / it is not specified, or doesn't match, return 'YOK'.
5. Shorts Size (altBedeni) - Lower size. MUST match one of: 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '4 Yaş', '6 Yaş', '8 Yaş', '10 Yaş', '12 Yaş', '14 Yaş'. If they don't want shorts / not specified, or doesn't match, return 'YOK'.
6. Socks (corap) - Socks color. MUST match one of colors: 'YOK', 'BEYAZ', 'KIRMIZI', 'SİYAH', 'YEŞİL', 'LACİVERT', 'SAKS MAVİ', 'BORDO', 'SARI', 'TURUNCU', 'TURKUAZ', 'GRİ', 'NEON SARI', 'NEON TURUNCU', 'FUŞYA', 'MOR', 'NEON YEŞİL', 'BUZ MAVİ'. If not present, specified or doesn't match, return 'YOK'.

Act strictly on what you find. Analyze the text or tables in the image carefully, even if handwritten. Convert correctly. Return as a clean JSON list of players.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        imagePart,
        { text: "Extract any and all player orders from this image in structured JSON format according to the schema." }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            players: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.STRING, description: "Jersey number like 10, 7 or empty string if not found." },
                  adet: { type: Type.INTEGER, description: "Order quantity, default is 1 if not stated." },
                  adiSoyadi: { type: Type.STRING, description: "Name and surname in uppercase with Turkish characters preserved." },
                  ustBedeni: { type: Type.STRING, description: "Shirt size like M, L, XL or YOK if blank or not ordered." },
                  altBedeni: { type: Type.STRING, description: "Shorts size like M, L, XL or YOK if blank or not ordered." },
                  corap: { type: Type.STRING, description: "Socks color or YOK." }
                },
                required: ["no", "adet", "adiSoyadi", "ustBedeni", "altBedeni", "corap"]
              }
            }
          },
          required: ["players"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      return res.status(500).json({ error: "Yapay zeka görselden metin okuyamadı veya boş sonuç döndü." });
    }

    const parsedData = JSON.parse(textResult.trim());
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Gemini parse error on Vercel:", error);
    return res.status(500).json({ error: error.message || "Görsel analizi sırasında bir hata oluştu." });
  }
}
