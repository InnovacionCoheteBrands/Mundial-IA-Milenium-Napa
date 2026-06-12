import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI, Modality } from "@google/genai";
import { teamInfo, type TeamId } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const WATERMARK_PATH = path.join(process.cwd(), "attached_assets", "logo_milenium__1767829210784.png");

async function addWatermarkToImage(imageBase64: string): Promise<string> {
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    
    const mainImage = sharp(imageBuffer);
    const metadata = await mainImage.metadata();
    
    if (!metadata.width || !metadata.height) {
      console.log("Could not get image metadata, returning original");
      return imageBase64;
    }

    const logoBuffer = fs.readFileSync(WATERMARK_PATH);
    const logoMaxWidth = Math.floor(metadata.width * 0.2);
    const logoMaxHeight = Math.floor(metadata.height * 0.15);
    
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoMaxWidth, logoMaxHeight, { fit: "inside" })
      .toBuffer();
    
    const logoMeta = await sharp(resizedLogo).metadata();
    const logoWidth = logoMeta.width || logoMaxWidth;
    const logoHeight = logoMeta.height || logoMaxHeight;
    
    const padding = Math.floor(Math.min(metadata.width, metadata.height) * 0.03);
    const left = metadata.width - logoWidth - padding;
    const top = metadata.height - logoHeight - padding;

    const watermarkedBuffer = await mainImage
      .composite([
        {
          input: resizedLogo,
          left,
          top,
        },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    return `data:image/jpeg;base64,${watermarkedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Watermark error:", error);
    return imageBase64;
  }
}

function getAIClient() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    throw new Error("AI integration not configured. Please ensure Gemini AI integration is set up.");
  }
  
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: "",
      baseUrl,
    },
  });
}

function getTransformationPrompt(team: TeamId): string {
  const teamData = teamInfo[team];

  return `You are a precision image editing tool. Your ONLY task is to edit the provided photo following the exact rules below. You are NOT a creative generator — you are an editor that must preserve the original with surgical precision.

=== INPUT ANALYSIS (Do this first) ===
1. Count the exact number of people in the photo.
2. Identify each person's face, body type, pose, and body position.
3. Identify the original background.
4. Output must contain EXACTLY the same people in the EXACT same positions.

=== ABSOLUTE PROHIBITIONS — ZERO TOLERANCE ===
PEOPLE:
- NEVER remove, delete, hide, or crop out ANY person.
- NEVER add new people.
- NEVER change the count of people.
- NEVER change anyone's relative position to others.

FACES — MOST CRITICAL:
- NEVER change, replace, alter, or regenerate ANY face.
- NEVER modify facial features: eyes, nose, mouth, jaw, cheekbones, forehead.
- NEVER change skin tone, skin texture, or complexion.
- NEVER change eye color, eye shape, or gaze direction.
- NEVER add or remove facial hair (beard, mustache, stubble).
- NEVER generate synthetic/AI faces. Use ONLY the original faces.
- NEVER swap faces between people.
- Faces must remain IDENTICAL pixel-for-pixel.

BODY & POSE — CRITICAL:
- NEVER change body type, body shape, or body size.
- NEVER change weight or build.
- NEVER change height proportions.
- NEVER change shoulder width or body frame.
- NEVER change torso position, angle, or rotation.
- NEVER change leg position, stance, or posture.
- NEVER change head position or angle.
- NEVER change hand shape, finger count, or hand structure.
- NEVER change overall body pose.

=== THE ONLY SINGLE EXCEPTION — ONE ARM FOR THE TROPHY ===
If and ONLY IF there is a person whose arm position is already suitable for holding a trophy, you may reposition ONLY ONE of their arms to naturally hold a FIFA World Cup trophy. All other body parts must remain EXACTLY as in the original.
- If the arm position is already close, make minimal adjustment.
- If the arm is not suitable, do NOT reposition it.
- Never change the other arm.
- Never change the hand's shape or fingers.
- Never change the shoulder position.
- Never change the torso angle.

=== THE EXACT THREE CHANGES ALLOWED ===
1. CLOTHING ONLY:
   - Replace ONLY the clothing with the ${teamData.name} national team jersey.
   - Every single person must get the jersey.
   - The jersey must fit naturally on the person's actual body.
   - Keep body proportions underneath the jersey.

2. ONE TROPHY (Optional — only if arm positioning permits):
   - Add ONE FIFA World Cup trophy.
   - Held by ONE person if their arm naturally allows it.
   - If arm does not naturally allow, the trophy can be placed nearby or celebrated with.
   - Other people celebrate naturally without changing their pose.

3. BACKGROUND ONLY:
   - Replace ONLY the background with a World Cup stadium.
   - Include: green pitch, stadium lights, confetti, crowd.
   - Do NOT change people positions.

=== VERIFICATION CHECKLIST ===
- Count people in input = Count people in output. EXACT same number.
- Each face = IDENTICAL to input. Compare face-by-face.
- Each body type = Same.
- Each pose = Same (except the ONE arm exception if applicable).
- Each person = Wearing ${teamData.name} jersey.
- Original clothing = Not visible.
- Background = World Cup stadium.

If there is ANY conflict between preserving the original and applying the edit, PRESERVE THE ORIGINAL. Never compromise on identity, face, body, or pose.

=== MODEL: gemini-3-pro-image-preview. OUTPUT: Edited photo.`;
}

async function transformImage(originalImageBase64: string, team: TeamId): Promise<string> {
  const ai = getAIClient();
  const base64Data = originalImageBase64.replace(/^data:image\/\w+;base64,/, "");
  const prompt = getTransformationPrompt(team);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/transform", async (req, res) => {
    try {
      const { team, image } = req.body;

      if (!team || !image) {
        return res.status(400).json({ error: "Team and image are required" });
      }

      if (!teamInfo[team as TeamId]) {
        return res.status(400).json({ error: "Invalid team selected" });
      }

      console.log(`Starting transformation for team: ${team}`);

      const prompt = getTransformationPrompt(team as TeamId);
      console.log("Using prompt for transformation");

      const transformedImage = await transformImage(image, team as TeamId);
      console.log("Image transformation complete");

      const watermarkedImage = await addWatermarkToImage(transformedImage);
      console.log("Watermark applied");

      const transformation = await storage.createTransformation({
        team,
        originalImageUrl: image,
        transformedImageUrl: watermarkedImage,
        promptUsed: prompt,
      });

      res.json({
        success: true,
        transformedImage: watermarkedImage,
        transformationId: transformation.id,
      });
    } catch (error) {
      console.error("Transformation error:", error);
      res.status(500).json({
        error: "Failed to transform image",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/transformations", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      const transformations = await storage.getAllTransformations();
      res.json(transformations);
    } catch (error) {
      console.error("Error fetching transformations:", error);
      res.status(500).json({ error: "Failed to fetch transformations" });
    }
  });

  app.get("/api/images", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");
      const transformations = await storage.getAllTransformations();
      res.json(transformations);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.get("/api/transformations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transformation = await storage.getTransformation(id);

      if (!transformation) {
        return res.status(404).json({ error: "Transformation not found" });
      }

      res.json(transformation);
    } catch (error) {
      console.error("Error fetching transformation:", error);
      res.status(500).json({ error: "Failed to fetch transformation" });
    }
  });

  return httpServer;
}
