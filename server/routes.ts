import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI, Modality } from "@google/genai";
import { teamInfo, type TeamId } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const MILENIUM_LOGO_PATH = path.join(process.cwd(), "attached_assets", "logo_milenium__1767829210784.png");
const TROPHY_LOGO_PATH = path.join(process.cwd(), "attached_assets", "ChatGPT_Image_6_ene_2026,_15_32_44_1767829210783.png");
const TRANSFORM_PIPELINE_VERSION = "2026-06-16-prompt-watermark-v2";

function logTransformRuntimeStatus() {
  const assetsStatus = {
    cwd: process.cwd(),
    pipelineVersion: TRANSFORM_PIPELINE_VERSION,
    mileniumLogoExists: fs.existsSync(MILENIUM_LOGO_PATH),
    trophyLogoExists: fs.existsSync(TROPHY_LOGO_PATH),
  };

  console.log("Transform runtime status:", assetsStatus);
}

function createValleDeNapaSvg(width: number): Buffer {
  const height = Math.round(width * 0.42);
  const residencialFontSize = Math.max(12, Math.round(width * 0.09));
  const residPaddingX = Math.max(10, Math.round(width * 0.045));
  const residPaddingY = Math.max(4, Math.round(height * 0.04));

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="rgba(0,0,0,0.9)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <text
          x="${width / 2}"
          y="${Math.round(height * 0.44)}"
          text-anchor="middle"
          fill="#ffffff"
          font-size="${Math.round(width * 0.22)}"
          font-weight="700"
          font-family="'Brush Script MT','Segoe Script','Lucida Handwriting',cursive"
        >
          Valle de Napa
        </text>
        <rect
          x="${Math.round(width * 0.24)}"
          y="${Math.round(height * 0.58)}"
          rx="4"
          ry="4"
          width="${Math.round(width * 0.52)}"
          height="${Math.round(height * 0.22)}"
          fill="rgba(255,255,255,0.96)"
        />
        <text
          x="${width / 2}"
          y="${Math.round(height * 0.73)}"
          text-anchor="middle"
          fill="#0f5c34"
          font-size="${residencialFontSize}"
          font-weight="900"
          letter-spacing="3"
          font-family="'Arial','Helvetica',sans-serif"
        >
          RESIDENCIAL
        </text>
      </g>
    </svg>
  `;

  return Buffer.from(svg);
}

async function prepareOverlay(
  input: Buffer,
  options: {
    maxWidth: number;
    maxHeight: number;
    tint?: string;
    boost?: boolean;
  }
): Promise<Buffer> {
  const base = sharp(input).trim().resize(options.maxWidth, options.maxHeight, { fit: "inside" });
  const processed = options.tint
    ? base.ensureAlpha().tint(options.tint)
    : base.ensureAlpha();

  const overlayBuffer = await (options.boost
    ? processed.modulate({ brightness: 1.08, saturation: 1.25 })
    : processed).png().toBuffer();

  const overlayMeta = await sharp(overlayBuffer).metadata();
  const width = overlayMeta.width || options.maxWidth;
  const height = overlayMeta.height || options.maxHeight;
  const shadowPadding = Math.max(12, Math.round(Math.min(width, height) * 0.18));

  const shadowAlpha = await sharp(overlayBuffer)
    .ensureAlpha()
    .extractChannel("alpha")
    .blur(Math.max(6, Math.round(Math.min(width, height) * 0.08)))
    .linear(0.95)
    .toBuffer();

  const shadowBuffer = await sharp({
    create: {
      width: width + shadowPadding * 2,
      height: height + shadowPadding * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0.92 },
          },
        })
          .joinChannel(shadowAlpha)
          .png()
          .toBuffer(),
        left: shadowPadding,
        top: shadowPadding,
      },
      {
        input: overlayBuffer,
        left: shadowPadding,
        top: shadowPadding,
      },
    ])
    .png()
    .toBuffer();

  return shadowBuffer;
}

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

    const padding = Math.floor(Math.min(metadata.width, metadata.height) * 0.03);

    const mileniumLogoBuffer = fs.readFileSync(MILENIUM_LOGO_PATH);
    const trophyLogoBuffer = fs.readFileSync(TROPHY_LOGO_PATH);
    const mileniumMaxWidth = Math.floor(metadata.width * 0.2);
    const mileniumMaxHeight = Math.floor(metadata.height * 0.15);
    const trophyMaxWidth = Math.floor(metadata.width * 0.12);
    const trophyMaxHeight = Math.floor(metadata.height * 0.2);
    const valleLogoWidth = Math.floor(metadata.width * 0.26);

    const resizedMileniumLogo = await prepareOverlay(mileniumLogoBuffer, {
      maxWidth: mileniumMaxWidth,
      maxHeight: mileniumMaxHeight,
      boost: true,
    });

    const resizedTrophyLogo = await prepareOverlay(trophyLogoBuffer, {
      maxWidth: trophyMaxWidth,
      maxHeight: trophyMaxHeight,
      tint: "#d4a017",
      boost: true,
    });

    const valleLogoBuffer = await prepareOverlay(createValleDeNapaSvg(valleLogoWidth), {
      maxWidth: valleLogoWidth,
      maxHeight: Math.floor(valleLogoWidth * 0.42),
      boost: true,
    });

    const mileniumMeta = await sharp(resizedMileniumLogo).metadata();
    const mileniumWidth = mileniumMeta.width || mileniumMaxWidth;
    const mileniumHeight = mileniumMeta.height || mileniumMaxHeight;

    const trophyMeta = await sharp(resizedTrophyLogo).metadata();
    const trophyWidth = trophyMeta.width || trophyMaxWidth;
    const trophyHeight = trophyMeta.height || trophyMaxHeight;

    const valleMeta = await sharp(valleLogoBuffer).metadata();
    const valleWidth = valleMeta.width || valleLogoWidth;
    const valleHeight = valleMeta.height || Math.floor(valleLogoWidth * 0.42);

    const watermarkedBuffer = await mainImage
      .composite([
        {
          input: valleLogoBuffer,
          left: padding,
          top: metadata.height - valleHeight - padding,
        },
        {
          input: resizedMileniumLogo,
          left: metadata.width - mileniumWidth - padding,
          top: metadata.height - mileniumHeight - padding,
        },
        {
          input: resizedTrophyLogo,
          left: Math.max(padding, Math.round((metadata.width - trophyWidth) / 2)),
          top: metadata.height - trophyHeight - padding,
        },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    return `data:image/jpeg;base64,${watermarkedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Watermark error:", {
      error,
      pipelineVersion: TRANSFORM_PIPELINE_VERSION,
      cwd: process.cwd(),
      mileniumLogoPath: MILENIUM_LOGO_PATH,
      mileniumLogoExists: fs.existsSync(MILENIUM_LOGO_PATH),
      trophyLogoPath: TROPHY_LOGO_PATH,
      trophyLogoExists: fs.existsSync(TROPHY_LOGO_PATH),
    });
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

  return `You are a precision image editing tool. Your ONLY task is to edit the provided photo following the exact rules below. You are NOT a creative generator - you are an editor that must preserve the original with surgical precision.

=== INPUT ANALYSIS (Do this first) ===
1. Count the exact number of people in the photo.
2. Identify each person's face, body type, pose, and body position.
3. Identify permanent and semi-permanent identity markers for each person: tattoos, scars, moles, freckles, piercings, jewelry, glasses, hairstyle, hairline, ears, hands, fingers, and any visible distinctive details.
4. Identify the original background.
5. Output must contain EXACTLY the same people in the EXACT same positions.
6. Output must be HORIZONTAL in a clean 16:9 composition, matching a premium TV camera frame.
7. Treat the source person as the same real human being who took the photo. Identity preservation is the top priority above all style, spectacle, or background changes.

=== ABSOLUTE PROHIBITIONS - ZERO TOLERANCE ===
PEOPLE:
- NEVER remove, delete, hide, crop out, or partially replace ANY person.
- NEVER add new people.
- NEVER change the count of people.
- NEVER change anyone's relative position to others.

FACES - MOST CRITICAL:
- NEVER change, replace, alter, regenerate, reinterpret, or beautify ANY face.
- NEVER modify facial features: eyes, nose, mouth, jaw, cheekbones, forehead, chin, ears, or smile shape.
- NEVER change skin tone, skin texture, complexion, pores, wrinkles, or natural asymmetry.
- NEVER change eye color, eye shape, eyelids, gaze direction, or eyebrow shape.
- NEVER add or remove facial hair (beard, mustache, stubble).
- NEVER change lip shape, tooth visibility, smile width, smile curve, dimples, under-eye shape, eyelash presence, or forehead lines.
- NEVER change ear size, ear angle, ear lobe shape, or any ear accessory placement.
- NEVER change the perceived ethnicity or age of the person.
- NEVER make the subject look younger, older, slimmer, sharper, more symmetrical, or more photogenic.
- NEVER generate synthetic or AI-looking faces. Use ONLY the original faces.
- NEVER swap faces between people.
- Faces must remain IDENTICAL to the input identity.
- The final image must clearly be the same exact person from the input photo, not a similar-looking person.
- Preserve the same facial identity even under new stadium lighting. Lighting may change, but identity may not.

BODY, HANDS, AND POSE - CRITICAL:
- NEVER change body type, body shape, body size, build, or proportions.
- NEVER change height proportions.
- NEVER change shoulder width, neck width, chest volume, arm thickness, or hand proportions.
- NEVER change torso position, angle, or rotation.
- NEVER change leg position, stance, posture, or balance.
- NEVER change head position or angle.
- NEVER change hand shape, finger count, finger length, or hand structure.
- NEVER change overall body pose.
- NEVER change tattoos, scars, moles, freckles, piercings, jewelry, glasses, nails, or any personal identity marker.
- NEVER remove, invent, clean up, redesign, or simplify any visible personal detail.
- NEVER change hairstyle, hair volume, or hairline.
- NEVER remove, alter, or redesign hats, caps, beanies, headbands, earrings, piercings, necklaces, bracelets, watches, or other worn accessories unless clothing replacement physically requires partial occlusion.
- If the person has unusual hair, dyed hair, short hair, long hair, messy hair, curls, shaved sides, or a cap/hat, preserve it exactly.
- If the person has tattoos on arms, hands, neck, or any visible area, preserve their exact presence, placement, scale, orientation, and visual character.
- If the person has piercings or earrings, preserve exact side, count, placement, and visibility.
- Preserve the person's same build, same body mass, same shoulder slope, same neck length, same arm volume, and same hand size.
- NEVER crop the person in a way that changes the intended framing of the original subject.
- NEVER zoom into the subject so much that body scale, hand scale, or face scale feel exaggerated versus a realistic camera shot.

=== IDENTITY LOCK ===
- Preserve the exact same real person from the source image.
- Do not reinterpret the person as a cleaner, more handsome, more athletic, more symmetrical, or more generic version.
- Do not "improve" the face.
- Do not "fix" skin.
- Do not change the natural relationship between face, hair, ears, cap, neck, shoulders, hands, tattoos, and accessories.
- Any detail that helps a human recognize that this is the same person must remain intact.

=== THE ONLY SINGLE EXCEPTION - ONE ARM FOR THE TROPHY ===
If and ONLY IF there is a person whose arm position is already suitable for holding a trophy, you may reposition ONLY ONE of their arms to naturally hold a FIFA World Cup trophy. All other body parts must remain EXACTLY as in the original.
- If the arm position is already close, make the smallest possible adjustment.
- If the arm is not suitable, do NOT reposition it.
- Never change the other arm.
- Never change the hand's shape or fingers.
- Never change the shoulder position.
- Never change the torso angle.

=== THE EXACT THREE CHANGES ALLOWED ===
1. CLOTHING ONLY:
   - Replace ONLY the clothing with the ${teamData.name} national team jersey.
   - Every single person must get the jersey.
   - The jersey must fit naturally on the person's real body and perspective.
   - Keep body proportions underneath the jersey.
   - Do not alter exposed skin, neck, face, hands, tattoos, or visible anatomy while applying the jersey.
   - Preserve folds, limb volume, and real body geometry.
   - If the original person is close to camera, preserve that same real camera relationship without enlarging or shrinking anatomy unnaturally.

2. ONE TROPHY (Optional - only if arm positioning permits):
   - Add ONE FIFA World Cup trophy.
   - Held by ONE person if their arm naturally allows it.
   - If arm does not naturally allow, the trophy can be placed nearby.
   - Other people may feel celebratory, but do not change their pose.

3. BACKGROUND ONLY:
   - Replace ONLY the background with an epic World Cup final stadium.
   - Make the environment premium, photorealistic, high-impact, and TV-broadcast spectacular.
   - Include: vivid green pitch, dramatic stadium lights, realistic crowd, layered depth, celebration energy, large confetti bursts, and subtle celebratory smoke or atmosphere.
   - Add victorious players celebrating in the background ONLY as distant background elements.
   - Background should feel like a live championship TV moment: premium sports broadcast, world-final energy, realistic lens behavior, and strong visual impact.
   - Apply subtle stadium depth-of-field so the background feels slightly camera-soft while the subject remains the sharp hero.
   - Enhance ONLY the environment, lighting mood, stadium spectacle, and broadcast realism around the subjects.
   - Keep the people grounded naturally in the scene with believable light direction and shadows, without changing their facial or body features.
   - Do NOT change people positions.
   - Keep the trophy and all added celebration elements properly scaled and realistic.

=== STYLE TARGET ===
- Photorealistic premium sports broadcast image.
- Hero-shot energy, champion celebration, prime-time television look.
- Crisp facial detail, natural skin texture, rich national colors, believable depth, and powerful stadium atmosphere.
- Slightly softened stadium background, sharp subject, realistic broadcast-lens feeling.
- Spectacular result must come from stadium scale, lighting, confetti explosions, crowd energy, distant player celebration, and realism - NOT from changing the people.

=== FRAMING AND COMPOSITION ===
- Final image must be horizontal 16:9.
- Match the app preview framing style: wide, balanced, TV-friendly composition.
- Keep the subject fully readable in frame with natural head, shoulder, hand, and torso proportions.
- Never output a vertical portrait composition.
- Never crop in a way that makes hands, face, or trophy feel oversized or distorted.

=== VERIFICATION CHECKLIST ===
- Count people in input = Count people in output. EXACT same number.
- Each face = IDENTICAL to input. Compare face-by-face.
- Each body type = Same.
- Identity markers = Same tattoos, scars, moles, freckles, piercings, jewelry, glasses, hairstyle, ears, hands, and fingers.
- Headwear and accessories = Same cap, hat, earrings, piercings, glasses, jewelry, and visible personal items.
- Hair = Same hairstyle, same hairline, same hair volume, same unusual hair traits if present.
- Person recognition test = a friend of the subject should immediately recognize it is the exact same person from the input.
- Each pose = Same (except the ONE arm exception if applicable).
- Each person = Wearing ${teamData.name} jersey.
- Original clothing = Not visible.
- Background = World Cup stadium.
- Output orientation = horizontal 16:9.
- Background feeling = realistic premium TV broadcast, not generic AI poster art.

If there is ANY conflict between preserving the original and applying the edit, PRESERVE THE ORIGINAL. Never compromise on identity, face, body, pose, tattoos, or proportions.

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
  logTransformRuntimeStatus();

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
