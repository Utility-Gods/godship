import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import satori from "satori";
import { html } from "satori-html";
import sharp from "sharp";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as any;
  const { title, category } = post.data;

  // Create SVG markup with the blog title
  const markup = html`
    <div
      style="display: flex; flex-direction: column; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 80px; justify-content: center;">
      <div
        style="display: flex; flex-direction: column; gap: 20px; color: white;">
        ${category
          ? `<div style="display: flex; font-size: 32px; color: #fca5a5; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">${category}</div>`
          : ""}
        <div
          style="display: flex; font-size: 64px; font-weight: 800; line-height: 1.2; font-family: 'Montserrat', sans-serif;">
          ${title}
        </div>
        <div
          style="display: flex; font-size: 28px; color: rgba(255,255,255,0.9); margin-top: 20px;">
          utilitygods.com
        </div>
      </div>
    </div>
  `;

  // Convert to SVG using Satori
  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Roboto",
        data: await fetch(
          "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf"
        ).then((res) => res.arrayBuffer()),
        weight: 400,
        style: "normal",
      },
      {
        name: "Roboto",
        data: await fetch(
          "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf"
        ).then((res) => res.arrayBuffer()),
        weight: 700,
        style: "normal",
      },
    ],
  });

  // Convert SVG to PNG using sharp
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
