import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai";

export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post("/ai/complete", async (request, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      templete: z.string(),
      temperature: z.number().min(0).max(1).default(0.5),
    });
    const { videoId, temperature, templete } = bodySchema.parse(request.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    });

    if (!video.transcription) {
      return reply.status(400).send({
        error: "Transcription not found",
      });
    }

    const promptMessage = templete.replace(
      "{transcription}",
      video.transcription
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      temperature,
      messages: [{ role: "user", content: promptMessage }],
    });

    return response;
  });
}
