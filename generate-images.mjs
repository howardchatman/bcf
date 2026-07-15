/* =========================================================
   BLACK CIGAR FESTIVAL — AI image generation (OpenAI)
   Generates every image the site needs into ./images/.
   The site auto-detects them (see script.js) — no HTML edits.

   USAGE:
     set OPENAI_API_KEY=sk-...        (PowerShell: $env:OPENAI_API_KEY="sk-...")
     node generate-images.mjs         (add --only smoke,lit-end to regenerate some)

   Model: gpt-image-1  ·  ~9 images total
   ========================================================= */
import fs from "fs";
import path from "path";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set.");
  console.error('PowerShell:  $env:OPENAI_API_KEY = "sk-..."   then re-run:  node generate-images.mjs');
  process.exit(1);
}

const OUT = path.join(process.cwd(), "images");
fs.mkdirSync(OUT, { recursive: true });

const STYLE =
  "Photorealistic, cinematic, moody chiaroscuro lighting, deep black background, " +
  "warm amber and gold rim light, luxurious premium-cigar aesthetic, no text, no watermark, no people.";

const IMAGES = [
  {
    name: "smoke",
    size: "1536x1024",
    prompt:
      `Thick elegant plumes of cigar smoke curling and billowing upward against a pure black background. ` +
      `Wispy, silky tendrils catching warm amber light from below, high contrast, ethereal. ${STYLE}`
  },
  {
    name: "lit-end",
    size: "1024x1024",
    prompt:
      `Extreme macro photograph of the glowing lit foot of a premium cigar viewed perfectly straight-on, ` +
      `filling the frame as a circle: molten orange ember cracks glowing between charred tobacco, ` +
      `a pale gray ash ring around the rim, embers pulsing orange-red at the center. ${STYLE}`
  },
  {
    name: "wrapper",
    size: "1024x1024",
    prompt:
      `Extreme macro texture of a dark oily maduro tobacco wrapper leaf, rich espresso-brown with fine veins ` +
      `and a silky sheen, evenly lit surface detail filling the entire frame edge-to-edge like a seamless texture. ${STYLE}`
  },
  {
    name: "binder",
    size: "1024x1024",
    prompt:
      `Extreme macro texture of a rustic tobacco binder leaf, medium caramel-brown, coarser grain with ` +
      `pronounced veins and slight roughness, texture filling the entire frame edge-to-edge like a seamless texture. ${STYLE}`
  },
  {
    name: "filler",
    size: "1024x1024",
    prompt:
      `Macro photograph of the cut cross-section of a premium handmade cigar viewed straight-on: ` +
      `bundled long-filler tobacco leaves folded into concentric swirls, layers of tan, caramel, and ` +
      `chocolate brown, filling the frame as a circle. ${STYLE}`
  },
  {
    name: "hero-cigar",
    size: "1536x1024",
    prompt:
      `A single premium handmade cigar floating horizontally on a pure black background, side view, ` +
      `dark oily wrapper with an elegant black-and-gold band, one end gently lit with a soft orange ember ` +
      `and a thin wisp of smoke rising, dramatic studio product photography. ${STYLE}`
  },
  {
    name: "lounge-1",
    size: "1536x1024",
    prompt:
      `Interior of an upscale cigar lounge: tufted leather chesterfield armchairs, dark walnut paneling, ` +
      `a glowing amber bar in the background, soft haze of smoke in the air, warm Edison lighting, empty of people. ${STYLE}`
  },
  {
    name: "lounge-2",
    size: "1536x1024",
    prompt:
      `Interior of a modern luxury cigar lounge: emerald velvet seating, brass and marble accents, ` +
      `backlit humidor wall of cigars, moody warm lighting with gentle smoke haze, empty of people. ${STYLE}`
  },
  {
    name: "lounge-3",
    size: "1536x1024",
    prompt:
      `Intimate speakeasy-style cigar lounge: exposed brick, low leather club chairs around a small round table ` +
      `with crystal glasses, single warm spotlight, curling smoke in the beam, empty of people. ${STYLE}`
  }
];

const only = (() => {
  const i = process.argv.indexOf("--only");
  return i > -1 ? process.argv[i + 1].split(",").map((s) => s.trim()) : null;
})();

async function generate(img) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: img.prompt,
      size: img.size,
      quality: "high",
      n: 1
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${img.name}: HTTP ${res.status} — ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data.data[0].b64_json;
  const file = path.join(OUT, `${img.name}.png`);
  fs.writeFileSync(file, Buffer.from(b64, "base64"));
  console.log(`✓ ${img.name}.png  (${img.size})`);
}

const queue = IMAGES.filter((i) => !only || only.includes(i.name));
console.log(`Generating ${queue.length} image(s) → ${OUT}\n`);
for (const img of queue) {
  try {
    await generate(img);
  } catch (e) {
    console.error(`✗ ${e.message}`);
  }
}
console.log("\nDone. Open index.html — the site picks the images up automatically.");
